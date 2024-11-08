package kr.suus.mapper;

import org.apache.ibatis.annotations.Mapper;

import kr.suus.dto.SignInReqDto;
import kr.suus.dto.SignInResDto;
import kr.suus.entity.Card;
import kr.suus.entity.Company;

@Mapper
public interface CompanyMapper {
	
	int ckComIdDup(String companyId);
	
	void insertCompany(Company company);
	
	void insertCard(Card card);
	
	SignInResDto ComSignIn(SignInReqDto signIndto);
	
	Company CompanyInfo(String userId);
	
	int UpdateCompanyInfo(Company company);
	
	Card GetCardData (String companyId);
	
	int UpdateCardData (Card card);
}
