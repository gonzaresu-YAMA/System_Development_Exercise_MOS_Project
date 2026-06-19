package com.midori.mos_backend.service;

import com.midori.mos_backend.Entity.MenuItem;
import com.midori.mos_backend.Entity.Order;
import com.midori.mos_backend.Entity.OrderItem;
import com.midori.mos_backend.Entity.Seat;
import com.midori.mos_backend.dto.OrderItemRequest;
import com.midori.mos_backend.dto.OrderRequest;
import com.midori.mos_backend.repository.MenuItemRepository;
import com.midori.mos_backend.repository.OrderRepository;
import com.midori.mos_backend.repository.SeatRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final SeatRepository seatRepository;

    public OrderService(OrderRepository orderRepository,
                        MenuItemRepository menuItemRepository,
                        SeatRepository seatRepository) {
        this.orderRepository = orderRepository;
        this.menuItemRepository = menuItemRepository;
        this.seatRepository = seatRepository;
    }

    public Order createOrder(OrderRequest request) {
        Order order = new Order();
        order.setCourseType(request.getCourseType());

        if (request.getSeatId() != null) {
            Seat seat = seatRepository.findById(request.getSeatId()).orElse(null);
            order.setSeat(seat);
            if (seat != null) {
                order.setTableNumber(seat.getSeatNumber());
            }
        }

        int total = 0;
        if (request.getItems() != null) {
            for (OrderItemRequest itemReq : request.getItems()) {
                OrderItem orderItem = new OrderItem();
                orderItem.setOrder(order);
                orderItem.setItemName(itemReq.getItemName());
                orderItem.setUnitPrice(itemReq.getUnitPrice());
                orderItem.setQuantity(itemReq.getQuantity());

                MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId()).orElse(null);
                orderItem.setMenuItem(menuItem);

                order.getItems().add(orderItem);
                total += itemReq.getUnitPrice() * itemReq.getQuantity();
            }
        }

        order.setTotalAmount(total);
        return orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Order> getOrdersBySeat(Long seatId) {
        return orderRepository.findBySeatId(seatId);
    }

    @Transactional(readOnly = true)
    public List<Order> getTodayOrders() {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        return orderRepository.findTodayOrders(start, end);
    }

    @Transactional(readOnly = true)
    public List<Order> getActiveOrders() {
        return orderRepository.findByStatusIn(List.of(
                Order.Status.PENDING,
                Order.Status.CONFIRMED,
                Order.Status.COOKING,
                Order.Status.READY
        ));
    }

    @Transactional(readOnly = true)
    public List<Order> getKitchenOrders() {
        return orderRepository.findByStatusIn(List.of(
                Order.Status.PENDING,
                Order.Status.CONFIRMED,
                Order.Status.COOKING
        ));
    }

    public Order updateStatus(Long orderId, Order.Status newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        order.setStatus(newStatus);
        if (newStatus == Order.Status.CONFIRMED) {
            order.setConfirmedAt(LocalDateTime.now());
        } else if (newStatus == Order.Status.COMPLETED) {
            order.setCompletedAt(LocalDateTime.now());
        }
        return orderRepository.save(order);
    }

    public Order addItemsToOrder(Long orderId, List<OrderItemRequest> itemRequests) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        int addedTotal = 0;
        for (OrderItemRequest req : itemRequests) {
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setItemName(req.getItemName());
            item.setUnitPrice(req.getUnitPrice());
            item.setQuantity(req.getQuantity());
            MenuItem menuItem = menuItemRepository.findById(req.getMenuItemId()).orElse(null);
            item.setMenuItem(menuItem);
            order.getItems().add(item);
            addedTotal += req.getUnitPrice() * req.getQuantity();
        }

        order.setTotalAmount(order.getTotalAmount() + addedTotal);
        return orderRepository.save(order);
    }
}
