package handler

import (
	"gorm.io/gorm"

	"logistics-platform-gin/internal/service"
)

// Package-level DB reference (initialized in main.go via InitDB)
var db *gorm.DB

// InitDB sets the package-level DB reference
func InitDB(database *gorm.DB) {
	db = database
}

// Package-level service references
var rocketMQSvc *service.RocketMQService
var minIOSvc *service.MinIOService

// InitServices sets the package-level service references
func InitServices(rmq *service.RocketMQService, minio *service.MinIOService) {
	rocketMQSvc = rmq
	minIOSvc = minio
}

// GetRocketMQ returns the RocketMQ service (may be nil if disabled)
func GetRocketMQ() *service.RocketMQService { return rocketMQSvc }

// GetMinIO returns the MinIO service (may be nil if disabled)
func GetMinIO() *service.MinIOService { return minIOSvc }