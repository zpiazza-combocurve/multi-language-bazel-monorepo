2022_03_24 updates
==================


1. Added togglePlot method to show/hide plots in a fastline chart. The standard APIs do not work because on fastline the legend is 
built using some fake plots. Before this build there was a togglePlot method but was used to select/deselect the plots. I renamed that 
one so now:

zingchart.plugins.fastline.togglePlot({
	id : ...
	plotindex : ...  // or
	plotid : ...
});

will toggle plot visibility, while

zingchart.plugins.fastline.togglePlotSelection({
	id : ...
	plotindex : ...  // or
	plotid : ...
});

will select/deselect the plot. (apparently you don't use this method yet)

Demo: togglePlot_es6.html



2. Added option for value scales (scaleY, scaleYn) to use a custom made progression logic. This is set via progression attribute:

scaleY : {
	...
	progression : "myProgression"
	...
}

The library will try to evaluate the value starting from the window context so the name can also be like "MyAPP.utils.myProgression" as 
long as the MyAPP is accessible from window.

The object that will be looked up has to contain at least two methods ("values" and "valueToCoord")

window.myProgression = {
	...
	value : function(oScaleParams) {
		// returns an array of values for the scale
		return [...];
	} 

	valueToCoord : function(fValue, oScaleParams) {
		// returns a number between 0 and 1 representing the ratio between the value and the reference value (usually the minimum value)
		// as an example, if the progression would be linear and scale is between 0 and 50, the function would return 0.5 for value=25 and 0.2 for value=10 
		return ...;
	}
}


Probit progression demos: probitV1.html, probitV2.html

Based on the provided information (https://verdazo.com/blog/type-curves-part-1-definitions-and-chart-types/ and especially https://verdazo.com/wp-content/uploads/2015/11/Oil-Peak-Rate-Probit-Chart.png)
i could not find any documentation on how the probit scale needs to be sampled, so i tried to approximate it in two ways:

a. One way is through an equation of the form 

sign * Math.exp(r1 * Math.sqrt(sign *  r2 * (50 - value)))

where sign is the sign of (50 - value) and r1 and r2 are two constants. In the probitV1.html demo i've added some sliders for you to change those values in search for a desired config.

b. If a) is not precise enough, there is a different approach in the probitV2.html demo, using some hardcoded ratios for each scale value.