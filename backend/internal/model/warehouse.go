package model

import (
	"time"
)

// WhWarehouse 仓库
type WhWarehouse struct {
	ID            int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Code          string    `gorm:"uniqueIndex;size:50;not null" json:"code"`
	Name          string    `gorm:"size:100;not null" json:"name"`
	Address       string    `gorm:"size:255" json:"address"`
	Manager       string    `gorm:"size:50" json:"manager"`
	Phone         string    `gorm:"size:20" json:"phone"`
	TotalCapacity float64   `gorm:"type:decimal(12,2);default:0" json:"totalCapacity"`
	UsedCapacity float64   `gorm:"type:decimal(12,2);default:0" json:"usedCapacity"`
	Status        int       `gorm:"default:1" json:"status"`
	Remark        string    `gorm:"size:500" json:"remark"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
	CreatedBy     string    `gorm:"size:64" json:"createdBy"`
	UpdatedBy     string    `gorm:"size:64" json:"updatedBy"`
	Deleted       bool      `gorm:"default:false" json:"deleted"`
}

func (WhWarehouse) TableName() string { return "wh_warehouse" }

// WhZone 库区
type WhZone struct {
	ID          int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	WarehouseID int64     `gorm:"not null" json:"warehouseId"`
	Code        string    `gorm:"size:50;not null" json:"code"`
	Name        string    `gorm:"size:100;not null" json:"name"`
	Type        string    `gorm:"size:20;default:STORAGE" json:"type"`
	TempType    string    `gorm:"size:20;default:NORMAL" json:"tempType"`
	Capacity    float64   `gorm:"type:decimal(12,2);default:0" json:"capacity"`
	Status      int       `gorm:"default:1" json:"status"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
	CreatedBy   string    `gorm:"size:64" json:"createdBy"`
	UpdatedBy   string    `gorm:"size:64" json:"updatedBy"`
	Deleted     bool      `gorm:"default:false" json:"deleted"`
}

func (WhZone) TableName() string { return "wh_zone" }

// WhLocation 库位
type WhLocation struct {
	ID          int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	WarehouseID int64     `gorm:"not null" json:"warehouseId"`
	ZoneID      *int64    `json:"zoneId"`
	Code        string    `gorm:"uniqueIndex;size:50;not null" json:"code"`
	Type        string    `gorm:"size:20;default:SHELF" json:"type"`
	ShelfLayer  int       `gorm:"default:1" json:"shelfLayer"`
	Capacity    float64   `gorm:"type:decimal(12,2);default:0" json:"capacity"`
	UsedCapacity float64  `gorm:"type:decimal(12,2);default:0" json:"usedCapacity"`
	Status      int       `gorm:"default:1" json:"status"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
	CreatedBy   string    `gorm:"size:64" json:"createdBy"`
	UpdatedBy   string    `gorm:"size:64" json:"updatedBy"`
	Deleted     bool      `gorm:"default:false" json:"deleted"`
}

func (WhLocation) TableName() string { return "wh_location" }

// WhInventory 库存
type WhInventory struct {
	ID             int64      `gorm:"primaryKey;autoIncrement" json:"id"`
	WarehouseID    int64      `gorm:"not null" json:"warehouseId"`
	LocationID     *int64     `json:"locationId"`
	Sku            string     `gorm:"size:100;not null" json:"sku"`
	GoodsName      string     `gorm:"size:200;not null" json:"goodsName"`
	Quantity       float64    `gorm:"type:decimal(12,3);default:0" json:"quantity"`
	Unit           string     `gorm:"size:20" json:"unit"`
	UnitPrice      *float64   `gorm:"type:decimal(12,2)" json:"unitPrice"`
	TotalValue     *float64   `gorm:"type:decimal(14,2)" json:"totalValue"`
	BatchNo        string     `gorm:"size:50" json:"batchNo"`
	ProductionDate *time.Time `json:"productionDate"`
	ExpiryDate     *time.Time `json:"expiryDate"`
	Status         int        `gorm:"default:1" json:"status"`
	CreatedAt      time.Time  `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt      time.Time  `gorm:"autoUpdateTime" json:"updatedAt"`
	CreatedBy      string     `gorm:"size:64" json:"createdBy"`
	UpdatedBy      string     `gorm:"size:64" json:"updatedBy"`
	Deleted        bool       `gorm:"default:false" json:"deleted"`
}

func (WhInventory) TableName() string { return "wh_inventory" }

// WhInboundOrder 入库单
type WhInboundOrder struct {
	ID                  int64         `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderNo             string        `gorm:"uniqueIndex;size:50;not null" json:"orderNo"`
	WarehouseID         int64         `gorm:"not null" json:"warehouseId"`
	SupplierName        string        `gorm:"size:200" json:"supplierName"`
	ExpectedArrivalTime *time.Time    `json:"expectedArrivalTime"`
	ActualArrivalTime   *time.Time    `json:"actualArrivalTime"`
	InboundType         string        `gorm:"size:20;default:PURCHASE" json:"inboundType"`
	Status              int           `gorm:"default:10" json:"status"`
	Remark              string        `gorm:"size:500" json:"remark"`
	Operator            string        `gorm:"size:50" json:"operator"`
	CreatedAt           time.Time     `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt           time.Time     `gorm:"autoUpdateTime" json:"updatedAt"`
	CreatedBy           string        `gorm:"size:64" json:"createdBy"`
	UpdatedBy           string        `gorm:"size:64" json:"updatedBy"`
	Deleted             bool          `gorm:"default:false" json:"deleted"`
	Items               []WhInboundItem `gorm:"foreignKey:InboundID" json:"items,omitempty"`
}

func (WhInboundOrder) TableName() string { return "wh_inbound_order" }

// WhInboundItem 入库明细
type WhInboundItem struct {
	ID            int64      `gorm:"primaryKey;autoIncrement" json:"id"`
	InboundID     int64      `gorm:"not null" json:"inboundId"`
	Sku           string     `gorm:"size:100;not null" json:"sku"`
	GoodsName     string     `gorm:"size:200;not null" json:"goodsName"`
	ExpectedQty   float64    `gorm:"type:decimal(12,3);default:0" json:"expectedQty"`
	ActualQty     float64    `gorm:"type:decimal(12,3);default:0" json:"actualQty"`
	Unit          string     `gorm:"size:20" json:"unit"`
	UnitPrice     *float64   `gorm:"type:decimal(12,2)" json:"unitPrice"`
	BatchNo       string     `gorm:"size:50" json:"batchNo"`
	ProductionDate *time.Time `json:"productionDate"`
	ExpiryDate    *time.Time `json:"expiryDate"`
	LocationID    *int64     `json:"locationId"`
	Status        int        `gorm:"default:10" json:"status"`
	CreatedAt     time.Time  `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt     time.Time  `gorm:"autoUpdateTime" json:"updatedAt"`
	CreatedBy     string     `gorm:"size:64" json:"createdBy"`
	UpdatedBy     string     `gorm:"size:64" json:"updatedBy"`
	Deleted       bool       `gorm:"default:false" json:"deleted"`
}

func (WhInboundItem) TableName() string { return "wh_inbound_item" }

// WhOutboundOrder 出库单
type WhOutboundOrder struct {
	ID               int64          `gorm:"primaryKey;autoIncrement" json:"id"`
	OrderNo          string         `gorm:"uniqueIndex;size:50;not null" json:"orderNo"`
	WarehouseID      int64          `gorm:"not null" json:"warehouseId"`
	CustomerName     string         `gorm:"size:100" json:"customerName"`
	CustomerAddress  string         `gorm:"size:255" json:"customerAddress"`
	CustomerPhone    string         `gorm:"size:20" json:"customerPhone"`
	OutboundType     string         `gorm:"size:20;default:SALE" json:"outboundType"`
	Status           int            `gorm:"default:10" json:"status"`
	Remark           string         `gorm:"size:500" json:"remark"`
	Operator         string         `gorm:"size:50" json:"operator"`
	CreatedAt        time.Time      `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt        time.Time      `gorm:"autoUpdateTime" json:"updatedAt"`
	CreatedBy        string         `gorm:"size:64" json:"createdBy"`
	UpdatedBy        string         `gorm:"size:64" json:"updatedBy"`
	Deleted          bool           `gorm:"default:false" json:"deleted"`
	Items            []WhOutboundItem `gorm:"foreignKey:OutboundID" json:"items,omitempty"`
}

func (WhOutboundOrder) TableName() string { return "wh_outbound_order" }

// WhOutboundItem 出库明细
type WhOutboundItem struct {
	ID           int64      `gorm:"primaryKey;autoIncrement" json:"id"`
	OutboundID   int64      `gorm:"not null" json:"outboundId"`
	Sku          string     `gorm:"size:100;not null" json:"sku"`
	GoodsName    string     `gorm:"size:200;not null" json:"goodsName"`
	OrderQty     float64    `gorm:"type:decimal(12,3);default:0" json:"orderQty"`
	PickedQty    float64    `gorm:"type:decimal(12,3);default:0" json:"pickedQty"`
	Unit         string     `gorm:"size:20" json:"unit"`
	BatchNo      string     `gorm:"size:50" json:"batchNo"`
	LocationID   *int64     `json:"locationId"`
	InventoryID  *int64     `json:"inventoryId"`
	Status       int        `gorm:"default:10" json:"status"`
	CreatedAt    time.Time  `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt    time.Time  `gorm:"autoUpdateTime" json:"updatedAt"`
	CreatedBy    string     `gorm:"size:64" json:"createdBy"`
	UpdatedBy    string     `gorm:"size:64" json:"updatedBy"`
	Deleted      bool       `gorm:"default:false" json:"deleted"`
}

func (WhOutboundItem) TableName() string { return "wh_outbound_item" }
