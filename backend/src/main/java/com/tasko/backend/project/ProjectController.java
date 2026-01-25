package com.tasko.backend.project;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ProjectResponse create(@RequestHeader("X-USER-ID") Long userId,
                                  @Valid @RequestBody ProjectCreateRequest req) {
        return projectService.create(userId, req);
    }

    @GetMapping("/my")
    public List<ProjectResponse> my(@RequestHeader("X-USER-ID") Long userId) {
        return projectService.listMy(userId);
    }

    @PostMapping("/join")
    public ProjectResponse join(@RequestHeader("X-USER-ID") Long userId,
                                @Valid @RequestBody ProjectJoinRequest req) {
        return projectService.joinByCode(userId, req.joinCode());
    }

    @GetMapping("/enrolled")
    public List<ProjectResponse> enrolled(@RequestHeader("X-USER-ID") Long userId) {
        return projectService.listEnrolled(userId);
    }
}
