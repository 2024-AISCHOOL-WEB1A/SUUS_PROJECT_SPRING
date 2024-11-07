package kr.suus.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import kr.suus.dto.ComSignUpDto;
import kr.suus.entity.Company;
import kr.suus.service.CompanyService;

@RestController
public class CompanyController {

	private final CompanyService companyService;

    @Autowired
    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }
    
//  Company ID 중복 확인
    @PostMapping("/ComIdDuplicate")
    public boolean ckComIdDup(@RequestBody Company company) {
    	System.out.println("Checking ID: " + company.getCompanyId());
        return companyService.ckComIdDup(company.getCompanyId());
    }
    
//  Company 가입
    @PostMapping("/SignUpCom")
    public ResponseEntity<String> signUpCompany(@RequestBody ComSignUpDto company){
    	return companyService.insertCompany(company);
    }
    
//	기업정보 수정
    @PostMapping("/UpdateCompanyInfo")
    public ResponseEntity<?> UpdateCompanyInfo(@RequestBody Company company){
    	System.out.println(company);
    	return companyService.UpdateCompanyInfo(company);
    }
}
