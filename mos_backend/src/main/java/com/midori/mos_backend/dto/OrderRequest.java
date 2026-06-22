package com.midori.mos_backend.dto;

import java.util.List;

public class OrderRequest {

    private Long seatId;
    private String courseType;
    private List<OrderItemRequest> items;

    public Long getSeatId() { return seatId; }
    public void setSeatId(Long seatId) { this.seatId = seatId; }

    public String getCourseType() { return courseType; }
    public void setCourseType(String courseType) { this.courseType = courseType; }

    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }
}
