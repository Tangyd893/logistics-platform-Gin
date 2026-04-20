package handler

import (
	"github.com/gin-gonic/gin"
	"logistics-platform-gin/internal/model"
	"logistics-platform-gin/pkg/response"
	"strconv"
)

type DriverHandler struct{}

func (h *DriverHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	var total int64
	db.Model(&model.TDriver{}).Where("deleted = false").Count(&total)
	var drivers []model.TDriver
	db.Where("deleted = false").Offset((page-1)*pageSize).Limit(pageSize).Find(&drivers)
	response.OK(c, gin.H{"list": drivers, "total": total, "page": page, "pageSize": pageSize})
}

func (h *DriverHandler) Create(c *gin.Context) {
	var req struct {
		Name       string `json:"name" binding:"required"`
		Phone      string `json:"phone" binding:"required"`
		LicenseNo  string `json:"licenseNo"`
		IDCard     string `json:"idCard"`
		WarehouseID *int64 `json:"warehouseId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}
	d := model.TDriver{Name: req.Name, Phone: req.Phone, LicenseNo: req.LicenseNo,
		IDCard: req.IDCard, WarehouseID: req.WarehouseID, Status: 1}
	db.Create(&d)
	response.OK(c, d)
}

type VehicleHandler struct{}

func (h *VehicleHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	var total int64
	db.Model(&model.TVehicle{}).Where("deleted = false").Count(&total)
	var vehicles []model.TVehicle
	db.Where("deleted = false").Offset((page-1)*pageSize).Limit(pageSize).Find(&vehicles)
	response.OK(c, gin.H{"list": vehicles, "total": total, "page": page, "pageSize": pageSize})
}

func (h *VehicleHandler) Create(c *gin.Context) {
	var req struct {
		PlateNo     string  `json:"plateNo" binding:"required"`
		Type        string  `json:"type"`
		CapacityKg  float64 `json:"capacityKg"`
		CapacityCbm float64 `json:"capacityCbm"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}
	v := model.TVehicle{PlateNo: req.PlateNo, Type: req.Type,
		CapacityKg: req.CapacityKg, CapacityCbm: req.CapacityCbm, Status: 1}
	db.Create(&v)
	response.OK(c, v)
}

type WaybillHandler struct{}

func (h *WaybillHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	var total int64
	db.Model(&model.TWaybill{}).Where("deleted = false").Count(&total)
	var waybills []model.TWaybill
	db.Where("deleted = false").Offset((page-1)*pageSize).Limit(pageSize).Find(&waybills)
	response.OK(c, gin.H{"list": waybills, "total": total, "page": page, "pageSize": pageSize})
}

func (h *WaybillHandler) Create(c *gin.Context) {
	var req struct {
		WaybillNo string  `json:"waybillNo" binding:"required"`
		OrderID   *int64  `json:"orderId"`
		DriverID  *int64  `json:"driverId"`
		VehicleID *int64  `json:"vehicleId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}
	w := model.TWaybill{WaybillNo: req.WaybillNo, OrderID: req.OrderID,
		DriverID: req.DriverID, VehicleID: req.VehicleID, Status: 1}
	db.Create(&w)
	response.OK(c, w)
}

type TrackingHandler struct{}

func (h *TrackingHandler) List(c *gin.Context) {
	waybillID := c.Param("waybillId")
	var tracks []model.TTracking
	db.Where("waybill_id = ?", waybillID).Order("operate_time ASC").Find(&tracks)
	response.OK(c, tracks)
}

func (h *TrackingHandler) Add(c *gin.Context) {
	var req struct {
		WaybillID    int64   `json:"waybillId" binding:"required"`
		Status       int     `json:"status" binding:"required"`
		Location     string  `json:"location"`
		Latitude     *float64 `json:"latitude"`
		Longitude    *float64 `json:"longitude"`
		Description  string  `json:"description"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}
	t := model.TTracking{
		WaybillID: req.WaybillID, Status: req.Status,
		Location: req.Location, Latitude: req.Latitude,
		Longitude: req.Longitude, Description: req.Description,
	}
	db.Create(&t)
	response.OK(c, t)
}
