package kr.suus.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import kr.suus.dto.ChartReqDto;
import kr.suus.dto.ChartResDto;
import kr.suus.service.ChartService;

@RestController
public class ChartController {
	
	private final ChartService chartService;

    @Autowired
    public ChartController(ChartService chartService) {
        this.chartService = chartService;
    }
	
	@PostMapping("/getChartData")
	public List<ChartResDto> getChartData(@RequestBody ChartReqDto reqdto) {
		List<ChartResDto> res = chartService.getChartData(reqdto);
		return res;
	}
	
	@PostMapping("/getSearchChartData")
	public List<ChartResDto> getSearchChartData(@RequestBody ChartReqDto reqdto) {
		List<ChartResDto> res = chartService.getSearchChartData(reqdto);
		return res;
	}
	
}
