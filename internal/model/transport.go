package model

import (
	"time"
)

// TDriver 司机
type TDriver struct {
	ID         int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Name       string    `gorm:"size:50;not null" json:"name"`
	Phone      string    `gorm:"size:20;not null" json:"phone"`
	LicenseNo  string    `gorm:"size:50" json:"licenseNo"`
	IDCard     string    `gorm:"size:20" json:"idCard"`
	Status     int       `gorm:"default:1" json:"status"`
	WarehouseID *int64   `json:"warehouseId"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt  time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
	CreatedBy  string    `gorm:"size:64" json:"createdBy"`
	UpdatedBy  string    `gorm:"size:64" json:"updatedBy"`
	Deleted    bool      `gorm:"default:false" json:"deleted"`
}

func (TDriver) TableName() string { return "t_driver" }

// TVehicle 车辆
type TVehicle struct {
	ID           int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	PlateNo      string    `gorm:"uniqueIndex;size:20;not null" json:"plateNo"`
	Type         string    `gorm:"size:50" json:"type"`
	CapacityKg   float64  `gorm:"type:decimal(10,2)" json:"capacityKg"`
	CapacityCbm  float64  `gorm:"type:decimal(10,4)" json:"capacityCbm"`
	Status       int      `gorm:"default:1" json:"status"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
	CreatedBy    string    `gorm:"size:64" json:"createdBy"`
	UpdatedBy    string    `gorm:"size:64" json:"updatedBy"`
	Deleted      bool     `gorm:"default:false" json:"deleted"`
}

func (TVehicle) TableName() string { return "t_vehicle" }

// TWaybill 运单
type TWaybill struct {
	ID               int64      `gorm:"primaryKey;autoIncrement" json:"id"`
	WaybillNo        string     `gorm:"uniqueIndex;size:50;not null" json:"waybillNo"`
	OrderID         *int64     `json:"orderId"`
	WarehouseID     *int64     `json:"warehouseId"`
	DriverID        *int64     `json:"driverId"`
	VehicleID       *int64     `json:"vehicleId"`
	PlanPickupTime  *time.Time `json:"planPickupTime"`
	PlanDeliveryTime *time.Time `json:"planDeliveryTime"`
	ActualPickupTime *time.Time `json:"actualPickupTime"`
	ActualDeliveryTime *time.Time `json:"actualDeliveryTime"`
	Status          int        `gorm:"default:1" json:"status"`
	CreatedAt       time.Time  `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt       time.Time  `gorm:"autoUpdateTime" json:"updatedAt"`
	CreatedBy       string     `gorm:"size:64" json:"createdBy"`
	UpdatedBy       string     `gorm:"size:64" json:"updatedBy"`
	Deleted         bool       `gorm:"default:false" json:"deleted"`
}

func (TWaybill) TableName() string { return "t_waybill" }

// TTracking 轨迹
type TTracking struct {
	ID         int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	WaybillID  int64     `gorm:"not null" json:"waybillId"`
	Status     int       `gorm:"not null" json:"status"`
	Location   string    `gorm:"size:255" json:"location"`
	Latitude   *float64  `gorm:"type:decimal(10,6)" json:"latitude"`
	Longitude  *float64  `gorm:"type:decimal(10,6)" json:"longitude"`
	Description string   `gorm:"size:255" json:"description"`
	OperateBy  *int64    `json:"operateBy"`
	OperateTime time.Time `gorm:"not null" json:"operateTime"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"createdAt"`
}

func (TTracking) TableName() string { return "t_tracking" }
