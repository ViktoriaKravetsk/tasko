package com.tasko.backend.project;

import com.tasko.backend.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ProjectResponse create(@AuthenticationPrincipal CurrentUser principal,
                                  @Valid @RequestBody ProjectCreateRequest req) {
        return projectService.create(principal.getUserId(), req);
    }

    @GetMapping("/my")
    public List<ProjectResponse> my(
            @AuthenticationPrincipal CurrentUser principal,
            @RequestParam(required = false) String search
    ) {
        return projectService.listMy(principal.getUserId(), search);
    }

    @PostMapping("/join")
    public ProjectResponse join(@AuthenticationPrincipal CurrentUser principal,
                                @Valid @RequestBody ProjectJoinRequest req) {
        return projectService.joinByCode(principal.getUserId(), req.joinCode());
    }

    @GetMapping("/enrolled")
    public List<ProjectResponse> enrolled(
            @AuthenticationPrincipal CurrentUser principal,
            @RequestParam(required = false) String search
    ) {
        return projectService.listEnrolled(principal.getUserId(), search);
    }

    @GetMapping("/{projectId}/progress/me")
    public ProjectProgressResponse myProgress(
            @AuthenticationPrincipal CurrentUser principal,
            @PathVariable Long projectId
    ) {
        return projectService.myProgress(principal.getUserId(), projectId);
    }

    @DeleteMapping("/{projectId}")
    public void delete(
            @AuthenticationPrincipal CurrentUser principal,
            @PathVariable Long projectId
    ) {
        projectService.deleteProject(principal.getUserId(), projectId);
    }

    @PostMapping("/{projectId}/leave")
    public void leave(
            @AuthenticationPrincipal CurrentUser principal,
            @PathVariable Long projectId
    ) {
        projectService.leaveProject(principal.getUserId(), projectId);
    }
}