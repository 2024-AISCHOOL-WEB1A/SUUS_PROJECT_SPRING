package kr.suus.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.suus.dto.ComSignUpDto;
import kr.suus.entity.Card;
import kr.suus.entity.Company;
import kr.suus.mapper.CompanyMapper;

@Service
public class CompanyService {
	private final CompanyMapper companyMapper;
	private EncryptionService encryptionService;

    @Autowired
    public CompanyService(CompanyMapper companyMapper, EncryptionService encryptionService) {
        this.companyMapper = companyMapper;
        this.encryptionService = encryptionService;
    }
    
//  기업 ID 중복 확인
    public boolean ckComIdDup(String companyId) {
        return companyMapper.ckComIdDup(companyId) > 0;
    }
    
//  기업 회원가입
    @Transactional(rollbackFor =  Exception.class)
    public ResponseEntity<String> insertCompany(ComSignUpDto company) {

        try {
        	int dupNum = companyMapper.ckComIdDup(company.getCompanyId());
    		if(dupNum > 0) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("중복된 아이디입니다.");
    		Company com = new Company();
    		com.setCompanyId(company.getCompanyId());
    		com.setCompanyPw(company.getCompanyPw());
    		com.setCompanyName(company.getCompanyName());
    		com.setContact(company.getContact());
    		companyMapper.insertCompany(com);
    		
    		Card card = new Card();
    		card.setCardNum(company.getCardNum());
    		card.setCardYuhyoDate(company.getCardYuhyoDate());
    		card.setBusinessNum(company.getBusinessNum());
    		card.setCompanyId(company.getCompanyId());
    		companyMapper.insertCard(card);
 			
            return ResponseEntity.ok("회원가입이 완료되었습니다.");
        } catch (DataAccessException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("회원가입 중 오류가 발생했습니다");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("요청 처리 중 문제가 발생했습니다");    
        }
    }
    
//	기업 정보 수정
    public ResponseEntity<?> UpdateCompanyInfo(Company company) {
    	try {
    		
    		int updateCnt = companyMapper.UpdateCompanyInfo(company);
    		
    		if (updateCnt > 0) {
    			System.out.println(updateCnt);
    			Company res = companyMapper.CompanyInfo(company.getCompanyId());
    			return ResponseEntity.ok(res);
    		}
    		
    	} catch (DataAccessException e){ return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("정보 불러오기 실패");
    	} catch (Exception e) { return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("요청 처리 중 문제가 발생했습니다"); }
    	return ResponseEntity.status(HttpStatus.NOT_FOUND).body("업데이트에 실패했습니다.");
	}
}
