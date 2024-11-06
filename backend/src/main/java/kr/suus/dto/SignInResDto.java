package kr.suus.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SignInResDto {
	private String companyId;
	private String userId;
	private String userName;
}
