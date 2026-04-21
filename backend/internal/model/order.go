package model

import (
	"time"
)

// OrderStatus 订单状态常量
const (
	OrderStatusPending   = 10  // 待确认
	OrderStatusConfirmed = 20  // 已确认
	OrderStatusInWarehouse = 30 // 已入库
	OrderStatusShipped   = 40  // 已发货
	OrderStatusInTransit = 50  // 运输中
	OrderStatusDelivered = 60  // 已送达
	OrderStatusCompleted = 70  // 已完成
	OrderStatusCancelled = 80  // 已取消
)

func OrderStatusName(code int) string {
	switch code {
	case OrderStatusPending:
		return "待确认"
	case OrderStatusConfirmed:
		return "已确认"
	case OrderStatusInWarehouse:
		return "已入库"
	case OrderStatusShipped:
		return "已发货"
	case OrderStatusInTransit:
		return "运输中"
	case OrderStatusDelivered:
		return "已送达"
	case OrderStatusCompleted:
		return "已完成"
	case OrderStatusCancelled:
		return "已取消"
	default:
		return "未知"
	}
}

// OOrder 订单
type OOrder struct {
	ID              int64        `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderNo         string      `gorm:"uniqueIndex;size:50;not null" json:"orderNo"`
	CustomerID      *int64      `json:"customerId"`
	SenderName      string      `gorm:"size:100;not null" json:"senderName"`
	SenderPhone     string      `gorm:"size:20;not null" json:"senderPhone"`
	SenderAddress   string      `gorm:"size:255;not null" json:"senderAddress"`
	ReceiverName    string      `gorm:"size:100;not null" json:"receiverName"`
	ReceiverPhone   string      `gorm:"size:20;not null" json:"receiverPhone"`
	ReceiverAddress string      `gorm:"size:255;not null" json:"receiverAddress"`
	TotalAmount     float64     `gorm:"type:decimal(12,2);default:0" json:"totalAmount"`
	WeightKg        *float64    `gorm:"type:decimal(10,2)" json:"weightKg"`
	VolumeCbm       *float64    `gorm:"type:decimal(10,4)" json:"volumeCbm"`
	Status          int         `gorm:"default:10" json:"status"`
	StatusName      string      `gorm:"-" json:"statusName"`
	Remark          string      `gorm:"size:500" json:"remark"`
	CreatedAt       time.Time   `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt       time.Time   `gorm:"autoUpdateTime" json:"updatedAt"`
	CreatedBy       string      `gorm:"size:64" json:"createdBy"`
	UpdatedBy       string      `gorm:"size:64" json:"updatedBy"`
	Deleted         bool        `gorm:"default:false" json:"deleted"`
	Items           []OOrderItem `gorm:"foreignKey:OrderID" json:"items,omitempty"`
	Logs            []OOrderStatusLog `gorm:"foreignKey:OrderID" json:"logs,omitempty"`
}

func (OOrder) TableName() string { return "o_order" }

// OOrderItem 订单明细
type OOrderItem struct {
	ID         int64      `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID    int64      `gorm:"not null" json:"orderId"`
	SkuName    string     `gorm:"size:200" json:"skuName"`
	SkuCode    string     `gorm:"size:50" json:"skuCode"`
	Quantity   int        `gorm:"not null" json:"quantity"`
	WeightKg   *float64   `gorm:"type:decimal(10,2)" json:"weightKg"`
	VolumeCbm  *float64   `gorm:"type:decimal(10,4)" json:"volumeCbm"`
	UnitPrice  *float64   `gorm:"type:decimal(10,2)" json:"unitPrice"`
	CreatedAt  time.Time  `gorm:"autoCreateTime" json:"createdAt"`
}

func (OOrderItem) TableName() string { return "o_order_item" }

// OOrderStatusLog 订单状态日志
type OOrderStatusLog struct {
	ID         int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderID    int64     `gorm:"not null" json:"orderId"`
	Status     int       `gorm:"not null" json:"status"`
	StatusName string    `gorm:"-" json:"statusName"`
	OperateBy  *int64    `json:"operateBy"`
	OperateTime time.Time `gorm:"not null" json:"operateTime"`
	Remark     string    `gorm:"size:255" json:"remark"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"createdAt"`
}

func (OOrderStatusLog) TableName() string { return "o_order_status_log" }
