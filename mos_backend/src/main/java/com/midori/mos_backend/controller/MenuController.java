package com.midori.mos_backend.controller;

import com.midori.mos_backend.Entity.Category;
import com.midori.mos_backend.Entity.MenuItem;
import com.midori.mos_backend.service.MenuService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(menuService.getAllCategories());
    }

    @GetMapping("/items")
    public ResponseEntity<List<MenuItem>> getItems(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice
    ) {
        if (category != null) {
            return ResponseEntity.ok(menuService.getItemsByCategory(category));
        }
        if (minPrice != null && maxPrice != null) {
            return ResponseEntity.ok(menuService.getItemsByPriceRange(minPrice, maxPrice));
        }
        return ResponseEntity.ok(menuService.getAllAvailableItems());
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<MenuItem> getItemById(@PathVariable Long id) {
        return menuService.getItemById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/items/search")
    public ResponseEntity<List<MenuItem>> searchItems(@RequestParam String keyword) {
        return ResponseEntity.ok(menuService.searchItems(keyword));
    }
}
