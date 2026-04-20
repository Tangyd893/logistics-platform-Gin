-- ============================================
-- 综合物流管理系统 - 数据库初始化脚本 v2
-- 数据库: PostgreSQL 16
-- 版本: Stage 2 仓储模块
-- ============================================

-- 创建数据库（需超级用户执行）
-- CREATE DATABASE logistics;
-- CREATE USER logistics_user WITH PASSWORD 'logistics_pass';
-- GRANT ALL PRIVILEGES ON DATABASE logistics TO logistics_user;

-- 连接 logistics 数据库后执行以下内容

-- -------------------------------------------
-- 1. 系统管理模块（sys_）
-- -------------------------------------------

CREATE TABLE IF NOT EXISTS sys_dept (
    id BIGSERIAL PRIMARY KEY,
    parent_id BIGINT REFERENCES sys_dept(id),
    name VARCHAR(50) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS sys_role (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS sys_menu (
    id BIGSERIAL PRIMARY KEY,
    parent_id BIGINT REFERENCES sys_menu(id),
    name VARCHAR(50) NOT NULL,
    path VARCHAR(200),
    component VARCHAR(200),
    icon VARCHAR(50),
    sort_order INT DEFAULT 0,
    type SMALLINT DEFAULT 1,
    perms VARCHAR(100),
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS sys_user (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    avatar VARCHAR(255),
    dept_id BIGINT REFERENCES sys_dept(id),
    warehouse_id BIGINT,
    role_code VARCHAR(50) NOT NULL DEFAULT 'USER',
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted BOOLEAN DEFAULT FALSE
);

-- -------------------------------------------
-- 2. 仓库管理模块（wh_）
-- -------------------------------------------

-- 仓库
CREATE TABLE IF NOT EXISTS wh_warehouse (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    manager VARCHAR(50),
    phone VARCHAR(20),
    total_capacity DECIMAL(12, 2) DEFAULT 0,
    used_capacity DECIMAL(12, 2) DEFAULT 0,
    status SMALLINT DEFAULT 1,
    remark VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted BOOLEAN DEFAULT FALSE
);

-- 库区
CREATE TABLE IF NOT EXISTS wh_zone (
    id BIGSERIAL PRIMARY KEY,
    warehouse_id BIGINT NOT NULL REFERENCES wh_warehouse(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) DEFAULT 'STORAGE',
    temp_type VARCHAR(20) DEFAULT 'NORMAL',
    capacity DECIMAL(12, 2) DEFAULT 0,
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted BOOLEAN DEFAULT FALSE,
    UNIQUE(warehouse_id, code)
);

-- 库位
CREATE TABLE IF NOT EXISTS wh_location (
    id BIGSERIAL PRIMARY KEY,
    warehouse_id BIGINT NOT NULL REFERENCES wh_warehouse(id),
    zone_id BIGINT REFERENCES wh_zone(id),
    code VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) DEFAULT 'SHELF',
    shelf_layer INT DEFAULT 1,
    capacity DECIMAL(12, 2) DEFAULT 0,
    used_capacity DECIMAL(12, 2) DEFAULT 0,
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted BOOLEAN DEFAULT FALSE
);

-- 库存
CREATE TABLE IF NOT EXISTS wh_inventory (
    id BIGSERIAL PRIMARY KEY,
    warehouse_id BIGINT NOT NULL REFERENCES wh_warehouse(id),
    location_id BIGINT REFERENCES wh_location(id),
    sku VARCHAR(100) NOT NULL,
    goods_name VARCHAR(200) NOT NULL,
    quantity DECIMAL(12, 3) DEFAULT 0,
    unit VARCHAR(20),
    unit_price DECIMAL(12, 2),
    total_value DECIMAL(14, 2),
    batch_no VARCHAR(50),
    production_date TIMESTAMP,
    expiry_date TIMESTAMP,
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted BOOLEAN DEFAULT FALSE
);

-- 入库单
CREATE TABLE IF NOT EXISTS wh_inbound_order (
    id BIGSERIAL PRIMARY KEY,
    order_no VARCHAR(50) NOT NULL UNIQUE,
    warehouse_id BIGINT NOT NULL REFERENCES wh_warehouse(id),
    supplier_name VARCHAR(200),
    expected_arrival_time TIMESTAMP,
    actual_arrival_time TIMESTAMP,
    inbound_type VARCHAR(20) DEFAULT 'PURCHASE',
    status SMALLINT DEFAULT 10,
    remark VARCHAR(500),
    operator VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted BOOLEAN DEFAULT FALSE
);

-- 入库明细
CREATE TABLE IF NOT EXISTS wh_inbound_item (
    id BIGSERIAL PRIMARY KEY,
    inbound_id BIGINT NOT NULL REFERENCES wh_inbound_order(id),
    sku VARCHAR(100) NOT NULL,
    goods_name VARCHAR(200) NOT NULL,
    expected_qty DECIMAL(12, 3) DEFAULT 0,
    actual_qty DECIMAL(12, 3) DEFAULT 0,
    unit VARCHAR(20),
    unit_price DECIMAL(12, 2),
    batch_no VARCHAR(50),
    production_date TIMESTAMP,
    expiry_date TIMESTAMP,
    location_id BIGINT REFERENCES wh_location(id),
    status SMALLINT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted BOOLEAN DEFAULT FALSE
);

-- 出库单
CREATE TABLE IF NOT EXISTS wh_outbound_order (
    id BIGSERIAL PRIMARY KEY,
    order_no VARCHAR(50) NOT NULL UNIQUE,
    warehouse_id BIGINT NOT NULL REFERENCES wh_warehouse(id),
    customer_name VARCHAR(100),
    customer_address VARCHAR(255),
    customer_phone VARCHAR(20),
    outbound_type VARCHAR(20) DEFAULT 'SALE',
    status SMALLINT DEFAULT 10,
    remark VARCHAR(500),
    operator VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted BOOLEAN DEFAULT FALSE
);

-- 出库明细
CREATE TABLE IF NOT EXISTS wh_outbound_item (
    id BIGSERIAL PRIMARY KEY,
    outbound_id BIGINT NOT NULL REFERENCES wh_outbound_order(id),
    sku VARCHAR(100) NOT NULL,
    goods_name VARCHAR(200) NOT NULL,
    order_qty DECIMAL(12, 3) DEFAULT 0,
    picked_qty DECIMAL(12, 3) DEFAULT 0,
    unit VARCHAR(20),
    batch_no VARCHAR(50),
    location_id BIGINT REFERENCES wh_location(id),
    inventory_id BIGINT REFERENCES wh_inventory(id),
    status SMALLINT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted BOOLEAN DEFAULT FALSE
);

-- -------------------------------------------
-- 3. 订单管理模块（o_）
-- -------------------------------------------

CREATE TABLE IF NOT EXISTS o_order (
    id BIGSERIAL PRIMARY KEY,
    order_no VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT,
    sender_name VARCHAR(100) NOT NULL,
    sender_phone VARCHAR(20) NOT NULL,
    sender_address VARCHAR(255) NOT NULL,
    receiver_name VARCHAR(100) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    receiver_address VARCHAR(255) NOT NULL,
    total_amount DECIMAL(12, 2) DEFAULT 0,
    weight_kg DECIMAL(10, 2),
    volume_cbm DECIMAL(10, 4),
    status SMALLINT DEFAULT 10,
    remark VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS o_order_item (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES o_order(id),
    sku_name VARCHAR(200),
    sku_code VARCHAR(50),
    quantity INT NOT NULL,
    weight_kg DECIMAL(10, 2),
    volume_cbm DECIMAL(10, 4),
    unit_price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS o_order_status_log (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES o_order(id),
    status SMALLINT NOT NULL,
    operate_by BIGINT,
    operate_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remark VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------
-- 4. 运输管理模块（t_）
-- -------------------------------------------

CREATE TABLE IF NOT EXISTS t_driver (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    license_no VARCHAR(50),
    id_card VARCHAR(20),
    status SMALLINT DEFAULT 1,
    warehouse_id BIGINT REFERENCES wh_warehouse(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_vehicle (
    id BIGSERIAL PRIMARY KEY,
    plate_no VARCHAR(20) NOT NULL UNIQUE,
    type VARCHAR(50),
    capacity_kg DECIMAL(10, 2),
    capacity_cbm DECIMAL(10, 4),
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_waybill (
    id BIGSERIAL PRIMARY KEY,
    waybill_no VARCHAR(50) NOT NULL UNIQUE,
    order_id BIGINT REFERENCES o_order(id),
    warehouse_id BIGINT REFERENCES wh_warehouse(id),
    driver_id BIGINT REFERENCES t_driver(id),
    vehicle_id BIGINT REFERENCES t_vehicle(id),
    plan_pickup_time TIMESTAMP,
    plan_delivery_time TIMESTAMP,
    actual_pickup_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(64),
    updated_by VARCHAR(64),
    deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_tracking (
    id BIGSERIAL PRIMARY KEY,
    waybill_id BIGINT NOT NULL REFERENCES t_waybill(id),
    status SMALLINT NOT NULL,
    location VARCHAR(255),
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    description VARCHAR(255),
    operate_by BIGINT,
    operate_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------
-- 5. 索引
-- -------------------------------------------

CREATE INDEX IF NOT EXISTS idx_user_username ON sys_user(username);
CREATE INDEX IF NOT EXISTS idx_user_dept ON sys_user(dept_id);
CREATE INDEX IF NOT EXISTS idx_menu_parent ON sys_menu(parent_id);
CREATE INDEX IF NOT EXISTS idx_dept_parent ON sys_dept(parent_id);
CREATE INDEX IF NOT EXISTS idx_zone_warehouse ON wh_zone(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_location_warehouse ON wh_location(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_location_zone ON wh_location(zone_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON wh_inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON wh_inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON wh_inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inbound_order_no ON wh_inbound_order(order_no);
CREATE INDEX IF NOT EXISTS idx_inbound_warehouse ON wh_inbound_order(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inbound_status ON wh_inbound_order(status);
CREATE INDEX IF NOT EXISTS idx_inbound_item_inbound ON wh_inbound_item(inbound_id);
CREATE INDEX IF NOT EXISTS idx_outbound_order_no ON wh_outbound_order(order_no);
CREATE INDEX IF NOT EXISTS idx_outbound_warehouse ON wh_outbound_order(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_outbound_status ON wh_outbound_order(status);
CREATE INDEX IF NOT EXISTS idx_outbound_item_outbound ON wh_outbound_item(outbound_id);
CREATE INDEX IF NOT EXISTS idx_order_customer ON o_order(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_status ON o_order(status);
CREATE INDEX IF NOT EXISTS idx_order_no ON o_order(order_no);
CREATE INDEX IF NOT EXISTS idx_waybill_order ON t_waybill(order_id);
CREATE INDEX IF NOT EXISTS idx_waybill_driver ON t_waybill(driver_id);
CREATE INDEX IF NOT EXISTS idx_tracking_waybill ON t_tracking(waybill_id);

-- -------------------------------------------
-- 6. 初始数据
-- -------------------------------------------

-- 部门
INSERT INTO sys_dept (name, sort_order) VALUES
    ('总经理室', 1),
    ('仓储部', 2),
    ('运输部', 3),
    ('客服部', 4),
    ('财务部', 5)
ON CONFLICT DO NOTHING;

-- 角色
INSERT INTO sys_role (name, code, description) VALUES
    ('系统管理员', 'ADMIN', '系统全部权限'),
    ('仓库管理员', 'WAREHOUSE_ADMIN', '仓库管理权限'),
    ('仓库操作员', 'WAREHOUSE_OPERATOR', '仓库操作权限'),
    ('调度员', 'DISPATCHER', '运输调度权限'),
    ('司机', 'DRIVER', '配送权限'),
    ('客户', 'CUSTOMER', '客户权限')
ON CONFLICT(code) DO NOTHING;

-- 管理员用户 (密码: admin123)
INSERT INTO sys_user (username, password, display_name, phone, email, dept_id, role_code, status) VALUES
    ('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '系统管理员', '13800138000', 'admin@logistics.com', 1, 'ADMIN', 1),
    ('warehouse_mgr', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '仓库经理', '13800138001', 'warehouse@logistics.com', 2, 'WAREHOUSE_ADMIN', 1),
    ('warehouse_op', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '仓库操作员', '13800138002', 'warehouse_op@logistics.com', 2, 'WAREHOUSE_OPERATOR', 1),
    ('dispatcher', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '调度员', '13800138003', 'dispatcher@logistics.com', 3, 'DISPATCHER', 1)
ON CONFLICT(username) DO NOTHING;

-- 仓库
INSERT INTO wh_warehouse (code, name, address, manager, phone, total_capacity, status) VALUES
    ('WH-BJ-001', '北京亦庄仓库', '北京市大兴区亦庄物流园A座', '李经理', '13800138010', 5000.00, 1),
    ('WH-SH-001', '上海浦东仓库', '上海市浦东新区物流园B座', '王经理', '13800138011', 4500.00, 1)
ON CONFLICT(code) DO NOTHING;

-- 库区
INSERT INTO wh_zone (warehouse_id, code, name, type, temp_type, capacity) VALUES
    (1, 'A-STORE', 'A区存储区', 'STORAGE', 'NORMAL', 2000.00),
    (1, 'A-PICK', 'A区拣货区', 'PICKING', 'NORMAL', 500.00),
    (1, 'B-COLD', 'B区冷藏区', 'STORAGE', 'COLD', 1000.00),
    (2, 'A-STORE', 'A区存储区', 'STORAGE', 'NORMAL', 1800.00),
    (2, 'B-FROZEN', 'B区冷冻区', 'STORAGE', 'FROZEN', 800.00)
ON CONFLICT(warehouse_id, code) DO NOTHING;

-- 库位
INSERT INTO wh_location (warehouse_id, zone_id, code, type, shelf_layer, capacity) VALUES
    (1, 1, 'A-STORE-01-001', 'SHELF', 1, 10.00),
    (1, 1, 'A-STORE-01-002', 'SHELF', 1, 10.00),
    (1, 1, 'A-STORE-02-001', 'SHELF', 2, 10.00),
    (1, 2, 'A-PICK-01', 'FLOOR', 1, 50.00),
    (1, 3, 'B-COLD-01-001', 'SHELF', 1, 20.00),
    (2, 4, 'A-STORE-01-001', 'SHELF', 1, 10.00),
    (2, 5, 'B-FROZEN-01-001', 'SHELF', 1, 20.00)
ON CONFLICT(code) DO NOTHING;

-- 司机
INSERT INTO t_driver (name, phone, license_no, warehouse_id, status) VALUES
    ('张师傅', '13900139001', '110101198001011234', 1, 1),
    ('李师傅', '13900139002', '110101198002021235', 1, 1),
    ('王师傅', '13900139003', '310101198003031236', 2, 1)
ON CONFLICT DO NOTHING;

-- 车辆
INSERT INTO t_vehicle (plate_no, type, capacity_kg, capacity_cbm, status) VALUES
    ('京A12345', '厢式货车', 5000.00, 20.00, 1),
    ('京B67890', '厢式货车', 3000.00, 15.00, 1),
    ('沪A11111', '厢式货车', 5000.00, 20.00, 1)
ON CONFLICT(plate_no) DO NOTHING;
