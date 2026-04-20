package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"logistics-platform-gin/internal/model"
	"logistics-platform-gin/pkg/response"
)

type UserHandler struct{}

func (h *UserHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	var total int64
	db.Model(&model.SysUser{}).Where("deleted = false").Count(&total)

	var users []model.SysUser
	db.Where("deleted = false").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&users)

	response.OK(c, gin.H{"list": users, "total": total, "page": page, "pageSize": pageSize})
}

func (h *UserHandler) GetByID(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var user model.SysUser
	if err := db.Where("deleted = false").First(&user, id).Error; err != nil {
		response.NotFound(c, "用户不存在")
		return
	}
	response.OK(c, user)
}

type UserCreateRequest struct {
	Username    string  `json:"username" binding:"required"`
	Password    string  `json:"password" binding:"required"`
	DisplayName string  `json:"displayName" binding:"required"`
	Phone       string  `json:"phone"`
	Email       string  `json:"email"`
	DeptID      *int64  `json:"deptId"`
	RoleCode    string  `json:"roleCode" binding:"required"`
	Status      int     `json:"status"`
}

func (h *UserHandler) Create(c *gin.Context) {
	var req UserCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}

	var user model.SysUser
	if err := db.Where("username = ? AND deleted = false", req.Username).First(&user).Error; err == nil {
		response.Fail(c, 400, "用户名已存在")
		return
	}

	user = model.SysUser{
		Username:    req.Username,
		Password:    req.Password, // controller should hash this
		DisplayName: req.DisplayName,
		Phone:       req.Phone,
		Email:       req.Email,
		DeptID:      req.DeptID,
		RoleCode:    req.RoleCode,
		Status:      req.Status,
	}

	if err := db.Create(&user).Error; err != nil {
		response.ServerError(c, "创建用户失败")
		return
	}
	response.OK(c, user)
}

func (h *UserHandler) Update(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var req UserCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}

	updates := map[string]interface{}{
		"display_name": req.DisplayName,
		"phone":        req.Phone,
		"email":        req.Email,
		"dept_id":      req.DeptID,
		"role_code":    req.RoleCode,
		"status":       req.Status,
	}
	if req.Password != "" {
		updates["password"] = req.Password
	}

	if err := db.Model(&model.SysUser{}).Where("id = ? AND deleted = false", id).Updates(updates).Error; err != nil {
		response.ServerError(c, "更新用户失败")
		return
	}
	response.OK(c, gin.H{"message": "更新成功"})
}

func (h *UserHandler) Delete(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	db.Model(&model.SysUser{}).Where("id = ?", id).Update("deleted", true)
	response.OK(c, gin.H{"message": "删除成功"})
}
