package kr.suus.util;

import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public class AESUtil {
	
//	암호화 메서드
	public static String encrypt(String plainText, String key, String iv) throws Exception {
	    // 키와 IV 길이 확인
	    if (key.length() != 16 && key.length() != 24 && key.length() != 32) {
	        throw new IllegalArgumentException("Invalid AES key length (must be 16, 24, or 32 characters)");
	    }
	    byte[] ivBytes = Base64.getDecoder().decode(iv); // IV가 Base64로 인코딩된 경우 디코딩
	    if (ivBytes.length != 16) {
	        throw new IllegalArgumentException("Invalid AES IV length (must be 16 bytes after Base64 decoding)");
	    }

	    // Cipher 생성 및 초기화
	    Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
	    SecretKeySpec secretKey = new SecretKeySpec(key.getBytes("UTF-8"), "AES");
	    IvParameterSpec ivSpec = new IvParameterSpec(ivBytes);

	    cipher.init(Cipher.ENCRYPT_MODE, secretKey, ivSpec);

	    // 암호화 실행
	    byte[] encrypted = cipher.doFinal(plainText.getBytes("UTF-8"));

	    // Base64 인코딩 후 반환
	    return Base64.getEncoder().encodeToString(encrypted);
	}
	
//	복호화 메서드
	public static String decrypt(String cipherText, String key, String iv) throws Exception {
	    // 키와 IV 길이 확인
	    if (key.length() != 16 && key.length() != 24 && key.length() != 32) {
	        throw new IllegalArgumentException("Invalid AES key length (must be 16, 24, or 32 characters)");
	    }
	    byte[] ivBytes = Base64.getDecoder().decode(iv); // IV가 Base64로 인코딩된 경우 디코딩
	    if (ivBytes.length != 16) {
	        throw new IllegalArgumentException("Invalid AES IV length (must be 16 bytes after Base64 decoding)");
	    }

	    // Cipher 생성 및 초기화
	    Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
	    SecretKeySpec secretKey = new SecretKeySpec(key.getBytes("UTF-8"), "AES");
	    IvParameterSpec ivSpec = new IvParameterSpec(ivBytes);

	    cipher.init(Cipher.DECRYPT_MODE, secretKey, ivSpec);

	    // 복호화 실행
	    byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(cipherText));

	    // 복호화된 텍스트를 문자열로 변환 후 반환
    	return new String(decrypted, "UTF-8");
	}
	
	 // 랜덤 IV 생성 메서드
    public static String generateIV() {
        byte[] iv = new byte[16]; // 16바이트 IV
        new SecureRandom().nextBytes(iv);
        return Base64.getEncoder().encodeToString(iv);
    }
}
