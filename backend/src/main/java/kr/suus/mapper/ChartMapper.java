package kr.suus.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.suus.dto.ChartReqDto;
import kr.suus.dto.ChartResDto;

@Mapper
public interface ChartMapper {
	
	 List<ChartResDto> findYearlyData(String companyId);
	 List<ChartResDto> findMonthlyData(String companyId);
	 List<ChartResDto> findWeeklyData(String companyId);
	 
	 List<ChartResDto> findSearchYearlyData(ChartReqDto reqdto);
	 List<ChartResDto> findSearchMonthlyData(ChartReqDto reqdto);
	 List<ChartResDto> findSearchWeeklyData(ChartReqDto reqdto);
}
