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
	
	int ckComIdDup(String companyId);
	
	int ckUserIdDup(String userId);
	
	void insertCompany(Company company);
	
	void insertCard(Card card);
	
	void insertUser(User user);
	
	SignInResDto ComSignIn(SignInReqDto signIndto);
	
	SignInResDto UserSignIn(SignInReqDto signIndto);
	
	Company CompanyInfo(String userId);
	
	User UserInfo(String userId);
	
	int UpdateCompanyInfo(Company company);
	
	int UpdateUserInfo(User user);

}
