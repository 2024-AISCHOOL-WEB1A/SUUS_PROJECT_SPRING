package kr.suus.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.suus.dto.CardInfoDto;
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
    		
    		String combinedData = String.format(
				"%s|%s|%s", 
	            company.getCardNum().replaceAll("-", ""), // 카드번호에서 '-' 제거
	            company.getCardYuhyoDate().replaceAll("/", ""), // 유효기간에서 '/' 제거
	            company.getSsnNum()
            );
    		
    		String iv = encryptionService.generateIV(); // 랜덤 IV 생성
            String encryptedData = encryptionService.encryptWithIV(combinedData, iv); // 데이터 암호화
            Card card = new Card();
            card.setEncryptedData(encryptedData); // 암호화된 데이터
            card.setIv(iv); // IV
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
    
//  카드정보 조회
    public ResponseEntity<?> GetCardData(String companyId) {
        try {
            // 데이터베이스에서 카드 정보 조회
            Card card = companyMapper.GetCardData(companyId);

            // 카드 정보가 없는 경우 처리
            if (card == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("카드 정보를 찾을 수 없습니다.");
            }

            String decryptedData;

            // 복호화 시도
            try {
                decryptedData = encryptionService.decryptWithIV(card.getEncryptedData(), card.getIv());
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("복호화 중 문제가 발생했습니다: " + e.getMessage());
            }

            // 복호화된 데이터 파싱
            String[] parts = decryptedData.split("\\|");
            if (parts.length != 3) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("복호화된 데이터 형식이 올바르지 않습니다.");
            }

            // 데이터 분리
            String cardNum = parts[0];
            String cardDate = parts[1];
            String ssnNum = parts[2];

            // 유효기간 분리
            String cardMonth = cardDate.substring(0, 2); // 첫 두 자리 = 월
            String cardYear = cardDate.substring(2, 4); // 나머지 두 자리 = 년

            // 주민등록번호 분리
            String ssnFront = ssnNum.substring(0, 6); // 앞 6자리
            String ssnBack = ssnNum.substring(6, 7); // 뒷자리 1자리

            // DTO 생성
            CardInfoDto cardInfoDto = new CardInfoDto();
            cardInfoDto.setCardNum(cardNum.replaceAll("(.{4})(?!$)", "$1-"));
            cardInfoDto.setCardMonth(cardMonth);
            cardInfoDto.setCardYear(cardYear);
            cardInfoDto.setSsnFront(ssnFront);
            cardInfoDto.setSsnBack(ssnBack);

            // 성공 응답
            return ResponseEntity.ok(cardInfoDto);

        } catch (DataAccessException e) {
            // 데이터베이스 접근 예외 처리
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("데이터베이스 조회 중 문제가 발생했습니다: " + e.getMessage());
        } catch (Exception e) {
            // 기타 예외 처리
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("요청 처리 중 문제가 발생했습니다: " + e.getMessage());
        }
    }
    
//  카드정보 수정
    public ResponseEntity<?> UpdateCardData(CardInfoDto cardInfo) {
    	String combinedData = String.format(
				"%s|%s|%s", 
				cardInfo.getCardNum().replaceAll("-", ""), // 카드번호에서 '-' 제거
				cardInfo.getCardMonth()+cardInfo.getCardYear(), // 유효기간에서 '/' 제거
				cardInfo.getSsnFront()+cardInfo.getSsnBack()
        );
    	
    	String iv = encryptionService.generateIV(); // 랜덤 IV 생성
        String encryptedData = encryptionService.encryptWithIV(combinedData, iv); // 데이터 암호화
        
        Card card = new Card();
        card.setEncryptedData(encryptedData); // 암호화된 데이터
        card.setIv(iv); // IV
        card.setCompanyId(cardInfo.getCompanyId());
        
        int res;
        
        try {
        	res = companyMapper.UpdateCardData(card);
	    } catch (DataAccessException e) {
	        // 데이터베이스 접근 예외 처리
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("데이터베이스 조회 중 문제가 발생했습니다: " + e.getMessage());
	    } catch (Exception e) {
	        // 기타 예외 처리
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("요청 처리 중 문제가 발생했습니다: " + e.getMessage());
	    }
    	System.out.println(res);
    	if(res > 0) {
    		return GetCardData(cardInfo.getCompanyId());
    	}else {
    		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("카드정보 업데이트에 실패하였습니다.");
    	}
	}
    
}
