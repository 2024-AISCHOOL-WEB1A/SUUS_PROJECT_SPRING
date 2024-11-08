package kr.suus.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Card {
	private int cardIdx;
	private String EncryptedData;
	private String iv;
	private String companyId;
}
