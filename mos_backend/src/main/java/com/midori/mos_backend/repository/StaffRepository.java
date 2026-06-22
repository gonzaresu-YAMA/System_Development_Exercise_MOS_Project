package com.midori.mos_backend.repository;

import com.midori.mos_backend.Entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, String> {
    Optional<Staff> findByIdIgnoreCase(String id);
}
