package model

import (
	"time"
)

// SysUser 系统用户
type SysUser struct {
	ID          int64      `gorm:"primaryKey;autoIncrement" json:"id"`
	Username    string     `gorm:"uniqueIndex;size:50;not null" json:"username"`
	Password    string     `gorm:"size:255;not null" json:"-"`
	DisplayName string     `gorm:"size:100;not null" json:"displayName"`
	Phone       string     `gorm:"size:20" json:"phone"`
	Email       string     `gorm:"size:100" json:"email"`
	Avatar      string     `gorm:"size:255" json:"avatar"`
	DeptID      *int64     `json:"deptId"`
	WarehouseID *int64     `json:"warehouseId"`
	RoleCode    string     `gorm:"size:50;not null;default:USER" json:"roleCode"`
	Status      int        `gorm:"default:1" json:"status"` // 0禁用 1启用
	CreatedAt   time.Time  `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time  `gorm:"autoUpdateTime" json:"updatedAt"`
	CreatedBy   string     `gorm:"size:64" json:"createdBy"`
	UpdatedBy   string     `gorm:"size:64" json:"updatedBy"`
	Deleted     bool       `gorm:"default:false" json:"deleted"`
	Dept        *SysDept   `gorm:"foreignKey:DeptID" json:"dept,omitempty"`
}

func (SysUser) TableName() string { return "sys_user" }

// SysRole 系统角色
type SysRole struct {
	ID          int64      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string     `gorm:"size:50;not null" json:"name"`
	Code        string     `gorm:"uniqueIndex;size:50;not null" json:"code"`
	Description string     `gorm:"size:255" json:"description"`
	Status      int        `gorm:"default:1" json:"status"`
	CreatedAt   time.Time  `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time  `gorm:"autoUpdateTime" json:"updatedAt"`
	CreatedBy   string     `gorm:"size:64" json:"createdBy"`
	UpdatedBy   string     `gorm:"size:64" json:"updatedBy"`
	Deleted     bool       `gorm:"default:false" json:"deleted"`
}

func (SysRole) TableName() string { return "sys_role" }

// SysDept 部门
type SysDept struct {
	ID        int64      `gorm:"primaryKey;autoIncrement" json:"id"`
	ParentID  *int64     `json:"parentId"`
	Name      string     `gorm:"size:50;not null" json:"name"`
	SortOrder int        `gorm:"default:0" json:"sortOrder"`
	CreatedAt time.Time  `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updatedAt"`
	CreatedBy string     `gorm:"size:64" json:"createdBy"`
	UpdatedBy string     `gorm:"size:64" json:"updatedBy"`
	Deleted   bool       `gorm:"default:false" json:"deleted"`
}

func (SysDept) TableName() string { return "sys_dept" }

// SysMenu 菜单
type SysMenu struct {
	ID         int64      `gorm:"primaryKey;autoIncrement" json:"id"`
	ParentID   *int64     `json:"parentId"`
	Name       string     `gorm:"size:50;not null" json:"name"`
	Path       string     `gorm:"size:200" json:"path"`
	Component  string     `gorm:"size:200" json:"component"`
	Icon       string     `gorm:"size:50" json:"icon"`
	SortOrder  int        `gorm:"default:0" json:"sortOrder"`
	Type       int        `gorm:"default:1" json:"type"`
	Perms      string     `gorm:"size:100" json:"perms"`
	Status     int        `gorm:"default:1" json:"status"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt  time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
	CreatedBy  string    `gorm:"size:64" json:"createdBy"`
	UpdatedBy  string    `gorm:"size:64" json:"updatedBy"`
	Deleted    bool      `gorm:"default:false" json:"deleted"`
}

func (SysMenu) TableName() string { return "sys_menu" }
