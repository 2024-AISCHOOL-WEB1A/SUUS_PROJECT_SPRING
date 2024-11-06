package kr.suus.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import kr.suus.dto.ComSignUpDto;
import kr.suus.dto.SignInReqDto;
import kr.suus.dto.UserInfoReqDto;
import kr.suus.entity.Company;
import kr.suus.entity.User;
import kr.suus.service.UserService;

@RestController
public class UserController {
    
	private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

//  Company ID 중복 확인
    @PostMapping("/ComIdDuplicate")
    public boolean ckComIdDup(@RequestBody Company company) {
    	  System.out.println("Checking ID: " + company.getCompanyId());
          return userService.ckComIdDup(company.getCompanyId());
    }
    
//  Company 가입
    @PostMapping("/SignUpCom")
    public ResponseEntity<String> signUpCompany(@RequestBody ComSignUpDto company){
    	return userService.insertCompany(company);
    }

//  User ID 중복 확인
    @PostMapping("/UserIdDuplicate")
	public boolean ckUserIdDup(@RequestBody User user) {
    	System.out.println("Checking ID: " + user.getUserId());
    	return userService.ckUserIdDup(user.getUserId());
    }

//  User 가입
    @PostMapping("/SignUpUser")
    public ResponseEntity<String> signUpUser(@RequestBody User user){
    	return userService.insertUser(user);
    }
    
//  로그인
    @PostMapping("/SignIn")
    public ResponseEntity<?> signIn(@RequestBody SignInReqDto signIndto){
    	return userService.signIn(signIndto);
    }
    
//  회원정보
    @PostMapping("/UserInfo")
    public ResponseEntity<?> userInfo(@RequestBody UserInfoReqDto infodto){
    	return userService.userInfo(infodto);
    }
    
//	기업정보 수정
    @PostMapping("/UpdateCompanyInfo")
    public ResponseEntity<?> UpdateCompanyInfo(@RequestBody Company company){
    	return userService.UpdateCompanyInfo(company);
    }
    
//  유저정보 수정
    @PostMapping("/UpdateUserInfo")
    public ResponseEntity<?> UpdateUserInfo(@RequestBody User user){
    	return userService.UpdateUserInfo(user);
    }
    
}