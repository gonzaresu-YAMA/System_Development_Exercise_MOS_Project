package com.midori.mos_backend.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import java.time.LocalDateTime;

@Entity
@Table(name = "T01")
public class Order {
    
    private String order_id;

    private String table_id;

    private String store_id;

    private int order_status;

    private LocalDateTime created_at;

    private LocalDateTime updated_at;

    private LocalDateTime ordered_at;
}
