package handler

import (
	"github.com/gin-gonic/gin"
	"logistics-platform-gin/internal/model"
	"logistics-platform-gin/pkg/response"
	"strconv"
)

type WarehouseHandler struct{}

func (h *WarehouseHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	var total int64
	db.Model(&model.WhWarehouse{}).Where("deleted = false").Count(&total)

	var warehouses []model.WhWarehouse
	db.Where("deleted = false").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&warehouses)

	response.OK(c, gin.H{"list": warehouses, "total": total, "page": page, "pageSize": pageSize})
}

func (h *WarehouseHandler) GetByID(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var wh model.WhWarehouse
	if err := db.Where("deleted = false").First(&wh, id).Error; err != nil {
		response.NotFound(c, "仓库不存在")
		return
	}
	response.OK(c, wh)
}

type WarehouseCreateRequest struct {
	Code   string  `json:"code" binding:"required"`
	Name   string  `json:"name" binding:"required"`
	Address string `json:"address"`
	Manager string `json:"manager"`
	Phone  string  `json:"phone"`
	TotalCapacity float64 `json:"totalCapacity"`
}

func (h *WarehouseHandler) Create(c *gin.Context) {
	var req WarehouseCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}
	wh := model.WhWarehouse{
		Code:   req.Code,
		Name:   req.Name,
		Address: req.Address,
		Manager: req.Manager,
		Phone:  req.Phone,
		TotalCapacity: req.TotalCapacity,
		Status: 1,
	}
	if err := db.Create(&wh).Error; err != nil {
		response.ServerError(c, "创建仓库失败")
		return
	}
	response.OK(c, wh)
}

func (h *WarehouseHandler) Update(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var req WarehouseCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}
	updates := map[string]interface{}{
		"name": req.Name, "address": req.Address,
		"manager": req.Manager, "phone": req.Phone,
		"total_capacity": req.TotalCapacity,
	}
	db.Model(&model.WhWarehouse{}).Where("id = ?", id).Updates(updates)
	response.OK(c, gin.H{"message": "更新成功"})
}

func (h *WarehouseHandler) Delete(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	db.Model(&model.WhWarehouse{}).Where("id = ?", id).Update("deleted", true)
	response.OK(c, gin.H{"message": "删除成功"})
}

// Location handlers
type LocationHandler struct{}

func (h *LocationHandler) List(c *gin.Context) {
	warehouseID := c.Query("warehouseId")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))

	query := db.Model(&model.WhLocation{}).Where("deleted = false")
	if warehouseID != "" {
		query = query.Where("warehouse_id = ?", warehouseID)
	}

	var total int64
	query.Count(&total)
	var locations []model.WhLocation
	query.Offset((page-1)*pageSize).Limit(pageSize).Find(&locations)
	response.OK(c, gin.H{"list": locations, "total": total, "page": page, "pageSize": pageSize})
}

func (h *LocationHandler) Create(c *gin.Context) {
	var req struct {
		WarehouseID int64   `json:"warehouseId" binding:"required"`
		ZoneID      *int64 `json:"zoneId"`
		Code        string `json:"code" binding:"required"`
		Type        string `json:"type"`
		ShelfLayer  int    `json:"shelfLayer"`
		Capacity    float64 `json:"capacity"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}
	loc := model.WhLocation{
		WarehouseID: req.WarehouseID,
		ZoneID:      req.ZoneID,
		Code:        req.Code,
		Type:        req.Type,
		ShelfLayer:  req.ShelfLayer,
		Capacity:    req.Capacity,
		Status:      1,
	}
	db.Create(&loc)
	response.OK(c, loc)
}

// Inbound handlers
type InboundHandler struct{}

func (h *InboundHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	var total int64
	db.Model(&model.WhInboundOrder{}).Where("deleted = false").Count(&total)
	var orders []model.WhInboundOrder
	db.Where("deleted = false").Offset((page-1)*pageSize).Limit(pageSize).Find(&orders)
	response.OK(c, gin.H{"list": orders, "total": total, "page": page, "pageSize": pageSize})
}

func (h *InboundHandler) Create(c *gin.Context) {
	var req struct {
		OrderNo      string  `json:"orderNo" binding:"required"`
		WarehouseID  int64   `json:"warehouseId" binding:"required"`
		SupplierName string  `json:"supplierName"`
		InboundType  string  `json:"inboundType"`
		Remark       string  `json:"remark"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}
	order := model.WhInboundOrder{
		OrderNo: req.OrderNo, WarehouseID: req.WarehouseID,
		SupplierName: req.SupplierName, InboundType: req.InboundType,
		Status: 10, Remark: req.Remark,
	}
	db.Create(&order)
	response.OK(c, order)
}

// Outbound handlers
type OutboundHandler struct{}

func (h *OutboundHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	var total int64
	db.Model(&model.WhOutboundOrder{}).Where("deleted = false").Count(&total)
	var orders []model.WhOutboundOrder
	db.Where("deleted = false").Offset((page-1)*pageSize).Limit(pageSize).Find(&orders)
	response.OK(c, gin.H{"list": orders, "total": total, "page": page, "pageSize": pageSize})
}

func (h *OutboundHandler) Create(c *gin.Context) {
	var req struct {
		OrderNo         string `json:"orderNo" binding:"required"`
		WarehouseID     int64  `json:"warehouseId" binding:"required"`
		CustomerName    string `json:"customerName"`
		CustomerAddress string `json:"customerAddress"`
		CustomerPhone  string `json:"customerPhone"`
		OutboundType    string `json:"outboundType"`
		Remark          string `json:"remark"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}
	order := model.WhOutboundOrder{
		OrderNo: req.OrderNo, WarehouseID: req.WarehouseID,
		CustomerName: req.CustomerName, CustomerAddress: req.CustomerAddress,
		CustomerPhone: req.CustomerPhone, OutboundType: req.OutboundType,
		Status: 10, Remark: req.Remark,
	}
	db.Create(&order)
	response.OK(c, order)
}

// Inventory handlers
type InventoryHandler struct{}

func (h *InventoryHandler) List(c *gin.Context) {
	warehouseID := c.Query("warehouseId")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))

	query := db.Model(&model.WhInventory{}).Where("deleted = false")
	if warehouseID != "" {
		query = query.Where("warehouse_id = ?", warehouseID)
	}

	var total int64
	query.Count(&total)
	var items []model.WhInventory
	query.Offset((page-1)*pageSize).Limit(pageSize).Find(&items)
	response.OK(c, gin.H{"list": items, "total": total, "page": page, "pageSize": pageSize})
}
