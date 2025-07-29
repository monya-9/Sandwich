//package com.sandwich.SandWich.user;
//
//
//import com.sandwich.SandWich.comment.domain.Comment;
//import com.sandwich.SandWich.post.domain.Post;
//import com.sandwich.SandWich.comment.repository.CommentRepository;
//import com.sandwich.SandWich.post.repository.PostRepository;
//import com.sandwich.SandWich.user.domain.Role;
//import com.sandwich.SandWich.user.domain.User;
//import com.sandwich.SandWich.user.repository.UserRepository;
//import com.sandwich.SandWich.user.service.UserService;
//import org.junit.jupiter.api.Test;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.context.SpringBootTest;
//import org.springframework.boot.test.mock.mockito.MockBean;
//import org.springframework.test.annotation.Rollback;
//import org.springframework.test.context.ActiveProfiles;
//import org.springframework.transaction.annotation.Transactional;
//
//import static org.junit.jupiter.api.Assertions.assertEquals;
//import jakarta.persistence.EntityManager;
//
//import java.util.List;
//
//@SpringBootTest
//@ActiveProfiles("test")
//@Transactional
//class UserDeleteIntegrationTest {
//
//    @Autowired
//    private EntityManager entityManager;
//    @Autowired private UserRepository userRepository;
//    @Autowired private PostRepository postRepository;
//    @Autowired private CommentRepository commentRepository;
//    @Autowired private UserService userService;
//    @MockBean
//    private com.sandwich.SandWich.upload.util.S3Uploader s3Uploader;
//    @Test
//    @Rollback
//    void 회원탈퇴시_게시글과댓글_익명처리된다() {
//        // given: 테스트 유저 생성
//        User user = User.builder()
//                .email("test@sandwich.com")
//                .username("테스트유저")
//                .provider("local")
//                .isVerified(true)
//                .isProfileSet(true)
//                .role(Role.ROLE_USER)
//                .build();
//        userRepository.save(user);
//
//        // 게시글 생성
//        Post post = Post.builder()
//                .title("테스트 게시글")
//                .content("내용입니다")
//                .user(user)
//                .build();
//        postRepository.save(post);
//
//        // 댓글 생성
//        Comment comment = Comment.builder()
//                .comment("테스트 댓글")
//                .user(user)
//                .commentableType("Post")       // 게시글 댓글이라는 의미
//                .commentableId(post.getId())   // 연결 대상 ID
//                .build();
//        commentRepository.save(comment);
//        // 강제 flush해서 DB에 반영
//        entityManager.flush();
//
//        // 진짜 저장됐는지 확인 (선택)
//        List<Post> posts = postRepository.findAllByUser(user);
//        System.out.println("저장된 게시글 수: " + posts.size());
//
//        // when: 유저 탈퇴 처리
//        userService.deleteMe(user);
//
//        // then: post와 comment의 작성자가 익명 계정으로 바뀌었는지 확인
//        Post updatedPost = postRepository.findById(post.getId()).orElseThrow();
//        Comment updatedComment = commentRepository.findById(comment.getId()).orElseThrow();
//
//        assertEquals("deleted@sandwich.com", updatedPost.getUser().getEmail());
//        assertEquals("deleted@sandwich.com", updatedComment.getUser().getEmail());
//    }
//}
