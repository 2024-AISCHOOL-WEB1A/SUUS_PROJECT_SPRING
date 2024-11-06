package kr.suus.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChartResDto {
	private int Year;
	private int Month;
	private int Day;
	private int UsageTime;
}
