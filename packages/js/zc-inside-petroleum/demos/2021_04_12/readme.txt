Updates - 2020_04_12
====================

1. Tooltips on scale markers - now if a tooltip object is being added on a scale marker, an active area along the 
line is generated, allowing for tooltip interactivity.

Demo: scale_markers_tooltips.html

2. Performance issues - the ZC lib and the fastline plugin were optimized on areas which are heavily used by the  fastline logic. 

Demo: fastline_perf_test.html

3. Separate plots as scatters instead of jsRules on line - demo was updated to add and manipulate separate scatter 
plots which can have their own jsRule settings.

Demo: separate_scatter_plots.html

4. Forcing min/max on y scales - this is not always creating the desired results. The library will try to create a nice 
formatted scale. If you want to overcome this (not recommended), you can add normalize:false to the Y scale, and then the step 
will be set to try to match the min/max combination. We recommend to use zoom-to : [minVal, maxVal] if you want to set a 
specific view of the scale-y.

5. min value on log x scales (work in progress)

6. Histogram demo - the demo was updated to showcase an example of using bin information from the histogram to trigger other actions.
In this case, highlighting the values on bins on a second chart.

Demo: histogram_demo.html

7. Repo: https://github.com/zingsoftinc/zc-inside-petroleum