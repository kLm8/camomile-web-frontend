/**
 * Created by stefas on 04/03/15.
 */
angular.module('myApp.directives').
  directive('cmContextBar', ['camomileService', function (camomileService) {
	  return {
		  restrict: 'A',
		  link: function (scope, element) {
			  var width = 470;
			  var height = 50;
			  var d3elmt = d3.select(element[0]);
			  var marker = d3elmt.append('g').append('rect')
				.attr('width', 0);
			  var contextMarks = d3elmt.append('g');
			  //var timescale = d3.time.scale().range([0, width]).clamp(true);
			  var timescale = d3.scale.linear().range([0, width]).clamp(true);
			  var targetBounds;
			  var contextLayer;

			  // Snippet for tooltip
			  var borderGenerator = function (w, h) {
				  return [
					  {'x': 0, 'y': 0},
					  {'x': 0, 'y': h},
					  {'x': w, 'y': h},
					  {'x': w, 'y': 0},
					  {'x': 0, 'y': 0}
				  ];
			  };
			  var tooltipWidth = 0;
			  var tooltipHeight = 0;
			  var tooltipPadding = 3;

			  var tooltip = d3.select("body")
				.append("svg")
				.attr("width", tooltipWidth + 2 * tooltipPadding)
				.attr("height", tooltipHeight)
				.style("position", "absolute")
				.style("z-index", "10")
				.style("visibility", "hidden");

			  var lineFunction = d3.svg.line()
				.x(function (d) {
					return d.x;
				})
				.y(function (d) {
					return d.y;
				})
				.interpolate("linear");

			  tooltip.append("path")
				.attr("d", lineFunction(borderGenerator(tooltipWidth + 2 * tooltipPadding, tooltipHeight)))
				.attr("stroke", "black")
				.attr("stroke-width", "2")
				.attr("fill", "white");

			  var tooltipText = tooltip.append('text');
			  var thumbnails = d3.select("#thumbnail");
			  thumbnails.style("visibility", "hidden");

			  // mousemove management at SVG level
			  // if mouse is over a mark, have it appearing
			  d3elmt.on("mousemove", function (d) {

				  var rectSel = d3elmt.selectAll('.mark')[0];
				  var i = 0, found;
				  var bodyElt = $("body")[0];
				  var coords = d3.mouse(bodyElt);

				  while (!found && (i < rectSel.length)) {
					  var dims = rectSel[i].getBBox();
					  dims.top = $(rectSel[i]).offset().top;
					  dims.left = $(rectSel[i]).offset().left;
					  if (dims.top <= coords[1] && dims.left <= coords[0] &&
						dims.top + dims.height >= coords[1] && dims.left + dims.width >= coords[0]) {
						  var aggrText = rectSel[i].__data__.data;
						  if (!$.isArray(aggrText)) {
							  aggrText = [ aggrText ];
						  }

						  tooltipHeight = 20 * aggrText.length;

						  aggrText = aggrText.join('\n');
						  tooltipText.datum(aggrText)
							.text(function (d2) {
								return d2;
							})
							.attr('x', tooltipPadding)
							.attr('y', tooltipHeight - tooltipPadding);
						  tooltipWidth = tooltipText[0][0].getComputedTextLength();

						  tooltip.attr("width", tooltipWidth + 2 * tooltipPadding)
							.attr("height", tooltipHeight)
							.select("path")
							.attr("d", lineFunction(borderGenerator(tooltipWidth + 2 * tooltipPadding, tooltipHeight)));

						  tooltip.style("top", (coords[1] - 10) + "px").style("left", (coords[0] + 10) + "px")
							.style("visibility", "visible");
						  found = true;

						  scope.$apply(function()
						  {
							  scope.model.thumbnail_current_time = rectSel[i].__data__.fragment.start;
						  });

						  // Context video thumbnail
						  thumbnails.style("visibility", "visible");
						  thumbnails.style("position", "absolute");
						  thumbnails.style("width", (tooltipWidth + tooltipPadding*2)+"px");
						  thumbnails.style("z-index", 10);
						  thumbnails.style("top", ((coords[1] + tooltipHeight)) -10 + "px").style("left", (coords[0] + 10) + "px")

					  } else {
						  tooltip.style("visibility", "hidden");
						  thumbnails.style("visibility", "hidden");
					  }
					  i++;
				  }


			  });

			  d3elmt.on("mouseout", function () {
				  tooltip.style("visibility", "hidden");
				  thumbnails.style("visibility", "hidden");
			  });

			  var updateMarker = function () {
				  marker.datum(targetBounds)
					.attr('x', function (d) {
						return timescale(d[0]);
					})
					.attr('y', 0)
					.attr('width', function (d) {
						return timescale(d[1]) - timescale(d[0]);
					})
					.attr('height', 50)
					.attr('fill', "#FF0000");

			  };

			  var updateContext = function () {
//                contextLayer.$promise.then(function (data) {
				  var curSelect = contextMarks.selectAll('.mark')
					.data(contextLayer, function (d) {
						return d._id;
					});
				  curSelect.enter().append('rect')
					.attr('class', 'mark');


				  curSelect.attr('x', function (d) {
					  return timescale(d.fragment.start);
				  })
					.attr('y', 0)
					.attr('width', function (d) {
						return timescale(d.fragment.end) - timescale(d.fragment.start);
					})
					.attr('height', 50)
					.attr('fill', "#777777")
					.attr('opacity', 0.5);

				  curSelect.exit().remove();
//                });
			  };


			  scope.$watch('model.queueData', function (newValue) {
				  if (newValue !== undefined && newValue.fragment !== undefined) {
					  timescale.domain([scope.model.infbndsec, scope.model.supbndsec]);
					  targetBounds = [scope.model.queueData.fragment.start, scope.model.queueData.fragment.end];
					  updateMarker();
					  if (scope.model.queueData.fragment.context !== undefined
						&& scope.model.queueData.fragment.context.id_medium !== undefined
						&& scope.model.queueData.fragment.context.id_medium !== ""
						&& scope.model.queueData.fragment.context._id !== undefined
						&& scope.model.queueData.fragment.context._id !== "") {

						  // Get the annotation used as context
						  camomileService.getAnnotations(function(err, data)
							{
								if(!err)
								{
									scope.$apply(function(){
										contextLayer = data;
										updateContext();
									});
								}
								else
								{
									alert(data.message);
								}

							},
							{
								filter: {
									id_layer: scope.model.queueData.fragment.context._id,
									id_medium: scope.model.queueData.fragment.context.id_medium
								}
							});
					  } else {
						  contextLayer = undefined;
					  }

				  }
			  }, true);

			  scope.$watch('[model.infbndsec, model.supbndsec]', function (newValue) {
				  if (newValue[1] !== undefined) {
					  timescale.domain([scope.model.infbndsec, scope.model.supbndsec]);
					  updateMarker();
					  if (contextLayer !== undefined) {
						  updateContext();
					  }
				  }
			  }, true);

		  }
	  }
  }]);

