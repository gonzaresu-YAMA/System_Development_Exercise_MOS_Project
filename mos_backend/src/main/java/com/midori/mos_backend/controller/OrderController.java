package com.midori.mos_backend.controller;

import com.midori.mos_backend.Entity.Order;
import com.midori.mos_backend.dto.OrderItemRequest;
import com.midori.mos_backend.dto.OrderRequest;
import com.midori.mos_backend.dto.OrderResponse;
import com.midori.mos_backend.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@RequestBody OrderRequest request) {
        Order order = orderService.createOrder(request);
        return ResponseEntity.ok(OrderResponse.from(order));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable Long id) {
        return orderService.getOrderById(id)
                .map(o -> ResponseEntity.ok(OrderResponse.from(o)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/table/{seatId}")
    public ResponseEntity<List<OrderResponse>> getOrdersByTable(@PathVariable Long seatId) {
        List<OrderResponse> list = orderService.getOrdersBySeat(seatId).stream()
                .map(OrderResponse::from).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/today")
    public ResponseEntity<List<OrderResponse>> getTodayOrders() {
        List<OrderResponse> list = orderService.getTodayOrders().stream()
                .map(OrderResponse::from).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/active")
    public ResponseEntity<List<OrderResponse>> getActiveOrders() {
        List<OrderResponse> list = orderService.getActiveOrders().stream()
                .map(OrderResponse::from).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/kitchen")
    public ResponseEntity<List<OrderResponse>> getKitchenOrders() {
        List<OrderResponse> list = orderService.getKitchenOrders().stream()
                .map(OrderResponse::from).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<OrderResponse> addItems(
            @PathVariable Long id,
            @RequestBody List<OrderItemRequest> items
    ) {
        Order order = orderService.addItemsToOrder(id, items);
        return ResponseEntity.ok(OrderResponse.from(order));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        Order.Status status = Order.Status.valueOf(body.get("status").toUpperCase());
        Order order = orderService.updateStatus(id, status);
        return ResponseEntity.ok(OrderResponse.from(order));
    }

    @PatchMapping("/{id}/confirm")
    public ResponseEntity<OrderResponse> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(OrderResponse.from(orderService.updateStatus(id, Order.Status.CONFIRMED)));
    }

    @PatchMapping("/{id}/cooking")
    public ResponseEntity<OrderResponse> startCooking(@PathVariable Long id) {
        return ResponseEntity.ok(OrderResponse.from(orderService.updateStatus(id, Order.Status.COOKING)));
    }

    @PatchMapping("/{id}/ready")
    public ResponseEntity<OrderResponse> markReady(@PathVariable Long id) {
        return ResponseEntity.ok(OrderResponse.from(orderService.updateStatus(id, Order.Status.READY)));
    }

    @PatchMapping("/{id}/served")
    public ResponseEntity<OrderResponse> markServed(@PathVariable Long id) {
        return ResponseEntity.ok(OrderResponse.from(orderService.updateStatus(id, Order.Status.COMPLETED)));
    }

    @PatchMapping("/{id}/paid")
    public ResponseEntity<OrderResponse> markPaid(@PathVariable Long id) {
        return ResponseEntity.ok(OrderResponse.from(orderService.updateStatus(id, Order.Status.COMPLETED)));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(OrderResponse.from(orderService.updateStatus(id, Order.Status.CANCELLED)));
    }
}
