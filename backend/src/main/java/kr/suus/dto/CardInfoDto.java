package kr.suus.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CardInfoDto {
	private String cardNum;
	private String cardMonth;
	private String cardYear;
	private String ssnFront;
	private String ssnBack;
	private String companyId;
}
