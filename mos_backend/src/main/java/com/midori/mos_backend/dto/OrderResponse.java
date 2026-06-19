package com.midori.mos_backend.dto;

import com.midori.mos_backend.Entity.Order;
import com.midori.mos_backend.Entity.OrderItem;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class OrderResponse {

    private Long id;
    private Long seatId;
    private String tableNumber;
    private String status;
    private int totalAmount;
    private String courseType;
    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime orderedAt;

    public static OrderResponse from(Order order) {
        OrderResponse res = new OrderResponse();
        res.id = order.getId();
        res.seatId = order.getSeat() != null ? order.getSeat().getId() : null;
        res.tableNumber = order.getTableNumber();
        res.status = order.getStatus().name();
        res.totalAmount = order.getTotalAmount();
        res.courseType = order.getCourseType();
        res.createdAt = order.getCreatedAt();
        res.orderedAt = order.getOrderedAt();
        res.items = order.getItems().stream()
                .map(OrderItemResponse::from)
                .collect(Collectors.toList());
        return res;
    }

    public static class OrderItemResponse {
        private Long id;
        private Long menuItemId;
        private String itemName;
        private int unitPrice;
        private int quantity;
        private String status;

        public static OrderItemResponse from(OrderItem item) {
            OrderItemResponse res = new OrderItemResponse();
            res.id = item.getId();
            res.menuItemId = item.getMenuItem() != null ? item.getMenuItem().getId() : null;
            res.itemName = item.getItemName();
            res.unitPrice = item.getUnitPrice();
            res.quantity = item.getQuantity();
            res.status = item.getStatus().name();
            return res;
        }

        public Long getId() { return id; }
        public Long getMenuItemId() { return menuItemId; }
        public String getItemName() { return itemName; }
        public int getUnitPrice() { return unitPrice; }
        public int getQuantity() { return quantity; }
        public String getStatus() { return status; }
    }

    public Long getId() { return id; }
    public Long getSeatId() { return seatId; }
    public String getTableNumber() { return tableNumber; }
    public String getStatus() { return status; }
    public int getTotalAmount() { return totalAmount; }
    public String getCourseType() { return courseType; }
    public List<OrderItemResponse> getItems() { return items; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getOrderedAt() { return orderedAt; }
}
