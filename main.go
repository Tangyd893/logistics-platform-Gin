package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"logistics-platform-gin/config"
	"logistics-platform-gin/internal/handler"
	"logistics-platform-gin/internal/middleware"
	"logistics-platform-gin/internal/model"
	"logistics-platform-gin/internal/router"
	"logistics-platform-gin/internal/service"
)

var (
	rocketMQSvc *service.RocketMQService
	minIOSvc    *service.MinIOService
)

func main() {
	cfg := config.Load()

	// Connect to database
	db, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize package-level DB reference in handlers
	handler.InitDB(db)

	// Initialize RocketMQ（失败不影响主服务）
	if cfg.RocketMQEnabled {
		rocketMQSvc, err = service.NewRocketMQService()
		if err != nil {
			log.Printf("[RocketMQ] 初始化失败: %v（将跳过消息功能）", err)
			rocketMQSvc = nil
		} else {
			// 启动消费者
			if err := rocketMQSvc.StartConsumers(); err != nil {
				log.Printf("[RocketMQ] 消费者启动失败: %v", err)
			}
		}
	} else {
		log.Println("[RocketMQ] 未启用（ROCKETMQ_ENABLED=false）")
	}

	// Initialize MinIO（失败不影响主服务）
	if cfg.MinIOEnabled {
		minIOSvc, err = service.NewMinIOService()
		if err != nil {
			log.Printf("[MinIO] 初始化失败: %v（将跳过文件上传功能）", err)
			minIOSvc = nil
		} else {
			log.Println("[MinIO] 初始化成功")
		}
	} else {
		log.Println("[MinIO] 未启用（MINIO_ENABLED=false）")
	}

	// Expose services to handlers
	handler.InitServices(rocketMQSvc, minIOSvc)

	// Safe schema creation
	if err := db.Exec("CREATE SCHEMA IF NOT EXISTS public").Error; err != nil {
		log.Printf("Warning: could not ensure schema: %v", err)
	}

	// Auto migrate
	if err := db.AutoMigrate(
		&model.SysUser{}, &model.SysRole{}, &model.SysDept{}, &model.SysMenu{},
		&model.OOrder{}, &model.OOrderItem{}, &model.OOrderStatusLog{},
		&model.WhWarehouse{}, &model.WhZone{}, &model.WhLocation{},
		&model.WhInventory{}, &model.WhInboundOrder{}, &model.WhInboundItem{},
		&model.WhOutboundOrder{}, &model.WhOutboundItem{},
		&model.TDriver{}, &model.TVehicle{}, &model.TWaybill{}, &model.TTracking{},
	); err != nil {
		log.Printf("Warning: AutoMigrate error (may be benign if schema exists): %v", err)
	}

	// Seed default admin
	var count int64
	db.Model(&model.SysUser{}).Where("username = ? AND deleted = false", "admin").Count(&count)
	if count == 0 {
		log.Println("Seeding default admin user (password: admin123)")
		db.Create(&model.SysUser{
			Username:    "admin",
			Password:    "$2a$10$ugmWj6ybRM31Ya4It5qETeFVmI9HpDKFYq1PXPcv2UI6LWGht4L8m",
			DisplayName: "系统管理员",
			Phone:       "13800138000",
			Email:       "admin@logistics.com",
			RoleCode:    "ADMIN",
			Status:      1,
		})
	}

	// Setup Gin
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(gin.Logger())
	r.Use(middleware.CORSMiddleware())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Register routes
	router.RegisterRoutes(r)

	// Graceful shutdown
	go func() {
		<-make(chan os.Signal, 1)
		log.Println("Shutting down...")
		if rocketMQSvc != nil {
			rocketMQSvc.Shutdown()
		}
	}()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("Logistics Platform Gin running on :%s\n", port)
	fmt.Printf("  RocketMQ: %s\n", map[bool]string{true: "enabled", false: "disabled"}[cfg.RocketMQEnabled])
	fmt.Printf("  MinIO:    %s\n", map[bool]string{true: "enabled", false: "disabled"}[cfg.MinIOEnabled])
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}