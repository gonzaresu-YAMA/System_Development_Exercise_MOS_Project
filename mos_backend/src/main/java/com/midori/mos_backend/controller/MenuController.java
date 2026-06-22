package com.midori.mos_backend.controller;

import com.midori.mos_backend.Entity.Category;
import com.midori.mos_backend.Entity.MenuItem;
import com.midori.mos_backend.dto.MenuItemRequest;
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

    // ── カテゴリ ─────────────────────────────────────────

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(menuService.getAllCategories());
    }

    // ── タグ ─────────────────────────────────────────────

    @GetMapping("/tags")
    public ResponseEntity<List<String>> getTags() {
        return ResponseEntity.ok(menuService.getAllTags());
    }

    // ── メニュー商品（読み取り）───────────────────────────

    @GetMapping("/items")
    public ResponseEntity<List<MenuItem>> getItems(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(required = false, defaultValue = "false") boolean all
    ) {
        if (all) {
            return ResponseEntity.ok(menuService.getAllItems());
        }
        if (category != null) {
            return ResponseEntity.ok(menuService.getItemsByCategory(category));
        }
        if (minPrice != null && maxPrice != null) {
            return ResponseEntity.ok(menuService.getItemsByPriceRange(minPrice, maxPrice));
        }
        return ResponseEntity.ok(menuService.getAllAvailableItems());
    }

    @GetMapping("/items/search")
    public ResponseEntity<List<MenuItem>> searchItems(@RequestParam String keyword) {
        return ResponseEntity.ok(menuService.searchItems(keyword));
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<MenuItem> getItemById(@PathVariable Long id) {
        return menuService.getItemById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── メニュー商品（書き込み）───────────────────────────

    @PostMapping("/items")
    public ResponseEntity<MenuItem> createItem(@RequestBody MenuItemRequest req) {
        return ResponseEntity.ok(menuService.createItem(req));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<MenuItem> updateItem(@PathVariable Long id, @RequestBody MenuItemRequest req) {
        try {
            return ResponseEntity.ok(menuService.updateItem(id, req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        menuService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }
}
