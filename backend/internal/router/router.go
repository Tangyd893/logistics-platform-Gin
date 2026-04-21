package router

import (
	"github.com/gin-gonic/gin"
	"logistics-platform-gin/internal/handler"
	"logistics-platform-gin/internal/middleware"
)

func RegisterRoutes(r *gin.Engine) {
	// Unauthenticated routes
	r.POST("/api/auth/login", authHandler().Login)
	r.POST("/api/auth/refresh", authHandler().Refresh)

	// Protected routes
	auth := r.Group("/api", middleware.JWTAuth())
	{
		auth.GET("/auth/me", authHandler().Me)
		auth.POST("/auth/logout", authHandler().Logout)

		// Orders
		orders := auth.Group("/order/orders")
		{
			orders.GET("", orderHandler().Page)
			orders.GET("/:id", orderHandler().GetByID)
			orders.GET("/no/:orderNo", orderHandler().GetByOrderNo)
			orders.POST("", orderHandler().Create)
			orders.PUT("/:id/status", orderHandler().UpdateStatus)
		}

		// Users
		users := auth.Group("/system/users")
		{
			users.GET("", userHandler().List)
			users.GET("/:id", userHandler().GetByID)
			users.POST("", userHandler().Create)
			users.PUT("/:id", userHandler().Update)
			users.DELETE("/:id", userHandler().Delete)
		}

		// Warehouses
		wh := auth.Group("/warehouse")
		{
			wh.GET("/warehouses", warehouseHandler().List)
			wh.GET("/warehouses/:id", warehouseHandler().GetByID)
			wh.POST("/warehouses", warehouseHandler().Create)
			wh.PUT("/warehouses/:id", warehouseHandler().Update)
			wh.DELETE("/warehouses/:id", warehouseHandler().Delete)

			wh.GET("/locations", locationHandler().List)
			wh.POST("/locations", locationHandler().Create)

			wh.GET("/inbounds", inboundHandler().List)
			wh.POST("/inbounds", inboundHandler().Create)

			wh.GET("/outbounds", outboundHandler().List)
			wh.POST("/outbounds", outboundHandler().Create)

			wh.GET("/inventory", inventoryHandler().List)
		}

		// Transport
		trans := auth.Group("/transport")
		{
			trans.GET("/drivers", driverHandler().List)
			trans.POST("/drivers", driverHandler().Create)

			trans.GET("/vehicles", vehicleHandler().List)
			trans.POST("/vehicles", vehicleHandler().Create)

			trans.GET("/waybills", waybillHandler().List)
			trans.POST("/waybills", waybillHandler().Create)

			trans.GET("/tracking/:waybillId", trackingHandler().List)
			trans.POST("/tracking", trackingHandler().Add)
		}
	}
}

func authHandler() *handler.AuthHandler { return &handler.AuthHandler{} }
func orderHandler() *handler.OrderHandler { return &handler.OrderHandler{} }
func userHandler() *handler.UserHandler { return &handler.UserHandler{} }
func warehouseHandler() *handler.WarehouseHandler { return &handler.WarehouseHandler{} }
func locationHandler() *handler.LocationHandler { return &handler.LocationHandler{} }
func inboundHandler() *handler.InboundHandler { return &handler.InboundHandler{} }
func outboundHandler() *handler.OutboundHandler { return &handler.OutboundHandler{} }
func inventoryHandler() *handler.InventoryHandler { return &handler.InventoryHandler{} }
func driverHandler() *handler.DriverHandler { return &handler.DriverHandler{} }
func vehicleHandler() *handler.VehicleHandler { return &handler.VehicleHandler{} }
func waybillHandler() *handler.WaybillHandler { return &handler.WaybillHandler{} }
func trackingHandler() *handler.TrackingHandler { return &handler.TrackingHandler{} }
