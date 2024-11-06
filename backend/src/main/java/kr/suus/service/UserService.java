package kr.suus.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.suus.dto.ComSignUpDto;
import kr.suus.dto.SignInReqDto;
import kr.suus.dto.SignInResDto;
import kr.suus.dto.UserInfoReqDto;
import kr.suus.entity.Card;
import kr.suus.entity.Company;
import kr.suus.entity.User;
import kr.suus.mapper.UserMapper;

@Service
public class UserService {
	private final UserMapper userMapper;

    @Autowired
    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

//  기업 ID 중복 확인
    public boolean ckComIdDup(String companyId) {
        return userMapper.ckComIdDup(companyId) > 0;
    }
    
//  기업 회원가입
    @Transactional(rollbackFor =  Exception.class)
    public ResponseEntity<String> insertCompany(ComSignUpDto company) {

        try {
        	int dupNum = userMapper.ckComIdDup(company.getCompanyId());
    		if(dupNum > 0) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("중복된 아이디입니다.");
    		Company com = new Company();
    		com.setCompanyId(company.getCompanyId());
    		com.setCompanyPw(company.getCompanyPw());
    		com.setCompanyName(company.getCompanyName());
    		com.setContact(company.getContact());
    		userMapper.insertCompany(com);
    		
    		Card card = new Card();
    		card.setCardNum(company.getCardNum());
    		card.setCardYuhyoDate(company.getCardYuhyoDate());
    		card.setBusinessNum(company.getBusinessNum());
    		card.setCompanyId(company.getCompanyId());
 			userMapper.insertCard(card);
 			
            return ResponseEntity.ok("회원가입이 완료되었습니다.");
        } catch (DataAccessException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("회원가입 중 오류가 발생했습니다");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("요청 처리 중 문제가 발생했습니다");    
        }
    }

//  유저 ID 중복 확인
    public boolean ckUserIdDup(String userId) {
    	return userMapper.ckUserIdDup(userId) > 0;
    }
    
//  유저 회원가입
    public ResponseEntity<String> insertUser(User user) {
    	
    	try {
    		int dupNum = userMapper.ckComIdDup(user.getCompanyId());
    		if (dupNum == 0) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("기업 아이디가 존재하지 않습니다.");
    		
    		dupNum = userMapper.ckUserIdDup(user.getUserId());
    		if(dupNum > 0) return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("중복된 아이디입니다.");
    		
    		userMapper.insertUser(user);
    		
    		return ResponseEntity.ok("회원가입이 완료되었습니다.");
    	} catch (DataAccessException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("회원가입 중 오류가 발생했습니다");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("요청 처리 중 문제가 발생했습니다");    
        }
	}
    
//  통합 로그인 기능
    public ResponseEntity<?> signIn(SignInReqDto signIndto) {
    	String signType = signIndto.getSignType();
    	SignInResDto res;
    	try {
    		if ("기업".equals(signType)) res = userMapper.ComSignIn(signIndto);
    		else res = userMapper.UserSignIn(signIndto);
    		
    		if(res != null) return ResponseEntity.ok(res);
    		
    		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인 실패");
    	}
    	catch (Exception e) {
    		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("요청 처리 중 문제가 발생했습니다");
    	}
	}
    
//  통합 개인정보 불러오기
    public ResponseEntity<?> userInfo(UserInfoReqDto infodto) {
		String Type = infodto.getType();
		String userId = infodto.getUserId();
		if("기업".equals(Type)) {
			Company res = userMapper.CompanyInfo(userId);
			if(res != null) return ResponseEntity.ok(res);
		}else {
			User res = userMapper.UserInfo(userId);
			if(res != null) return ResponseEntity.ok(res);
		}
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("정보 불러오기 실패");
	}
    
//	기업 정보 수정
    public ResponseEntity<?> UpdateCompanyInfo(Company company) {
    	try {
    		
    		int updateCnt = userMapper.UpdateCompanyInfo(company);
    		
    		if (updateCnt > 0) {
    			Company res = userMapper.CompanyInfo(company.getCompanyId());
    			return ResponseEntity.ok(res);
    		}
    		
    	} catch (DataAccessException e){ return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("정보 불러오기 실패");
    	} catch (Exception e) { return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("요청 처리 중 문제가 발생했습니다"); }
    	return ResponseEntity.status(HttpStatus.NOT_FOUND).body("업데이트에 실패했습니다.");
	}
    
//  회원 정보 수정
    public ResponseEntity<?> UpdateUserInfo(User user) {
		
    	try {
    		int updateCnt = userMapper.UpdateUserInfo(user);
    		
    		if (updateCnt > 0) {
    			User res = userMapper.UserInfo(user.getUserId());
    			return ResponseEntity.ok(res);
    		}
    		
    	} catch (DataAccessException e){ return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("정보 불러오기 실패");
    	} catch (Exception e) { return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("요청 처리 중 문제가 발생했습니다"); }
    	return ResponseEntity.status(HttpStatus.NOT_FOUND).body("업데이트에 실패했습니다.");
	}
}

