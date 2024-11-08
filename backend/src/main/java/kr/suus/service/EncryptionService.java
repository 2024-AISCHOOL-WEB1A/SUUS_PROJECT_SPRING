package kr.suus.service;

import org.springframework.stereotype.Service;

import kr.suus.util.AESUtil;

@Service
public class EncryptionService {

	private static final String SECRET_KEY = "01234567890123456789012345678901"; // 32바이트 키
	// 랜덤 IV 생성
    public String generateIV() {
        return AESUtil.generateIV();
    }
	
 // 암호화 메서드
    public String encryptWithIV(String plainText, String iv) {
    	System.out.println("암호화메서드 접근");
        try {
            return AESUtil.encrypt(plainText, SECRET_KEY, iv);
        } catch (Exception e) {
            throw new RuntimeException("Encryption error", e);
        }
    }

 // 복호화 메서드
    public String decryptWithIV(String cipherText, String iv) {
        try {
            return AESUtil.decrypt(cipherText, SECRET_KEY, iv);
        } catch (Exception e) {
            throw new RuntimeException("Decryption error", e);
        }
    }
	
}
