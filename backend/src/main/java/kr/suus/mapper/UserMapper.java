package kr.suus.mapper;

import org.apache.ibatis.annotations.Mapper;

import kr.suus.dto.SignInReqDto;
import kr.suus.dto.SignInResDto;
import kr.suus.dto.UserInfoReqDto;
import kr.suus.entity.Card;
import kr.suus.entity.Company;
import kr.suus.entity.User;

@Mapper
public interface UserMapper {
	
	int ckUserIdDup(String userId);
	
	void insertUser(User user);
	
	SignInResDto UserSignIn(SignInReqDto signIndto);
	
	User UserInfo(String userId);
	
	int UpdateUserInfo(User user);

}
