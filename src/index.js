import * as d3 from "d3";
import data from "./data.json";
import config from "./config.json";

console.log("config: ", config);
console.log("pubkey: ", config.levels[0].pubkey);
// console.log("rawdata:", data);

const getGroupLevel = (pubkey) => {
  const level = config.levels.find((level) => level.pubkey === pubkey);
  if (level) {
    return level.level;
  }
  return 0;
};

const data_transformed = { links: [], nodes: [] };

data.forEach((channel) => {
  const source = channel.pubkey;
  const target = channel.peer_pubkey;
  const capacity = parseInt(channel.capacity);
  const channel_data = {
    source: source,
    target: target,
    value: capacity,
    tooltip: `${channel.decoded_channel_id} - ${channel.capacity} msat`,
  };
  data_transformed.links.push(channel_data);
  if (!data_transformed.nodes.find((node) => node.id === target)) {
    if (!channel.node_info) {
      channel.node_info = {
        node: {
          alias: "Unknown",
          color: "#fff",
        },
        channels: {
          total_capacity: 0,
        },
      };
    } else if (!channel.node_info.node) {
      channel.node_info.node = {
        alias: "Unknown",
        color: "#fff",
      };
    }
    data_transformed.nodes.push({
      id: target,
      group: getGroupLevel(source),
      value: parseInt(channel.node_info.channels.total_capacity),
      color: channel.node_info.node.color,
      tooltip: `${channel.node_info.node.alias} - ${channel.node_info.channels.total_capacity} msat - ${channel.node_info.channels.num_channels} channels`,
    });
  }
});

// // add our node
// data_transformed.nodes.push({ id: pubkey, group: 1, value: total_capacity });

// console.log("transformed_data: ", data_transformed);

// Specify the dimensions of the chart.
const width = window.innerWidth;
const height = window.innerHeight;

// The force simulation mutates links and nodes, so create a copy
// so that re-evaluating this cell produces the same result.
const links = data_transformed.links.map((d) => ({ ...d }));
const nodes = data_transformed.nodes.map((d) => ({ ...d }));

// Create a simulation with several forces.
const simulation = d3
  .forceSimulation(nodes)
  .force(
    "link",
    d3.forceLink(links).id((d) => d.id),
  )
  .force("charge", d3.forceManyBody().strength(-42))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .on("tick", ticked);

// Create the SVG container.
const svg = d3
  .create("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("viewBox", [0, 0, width, height])
  .attr("style", "max-width: 100%; height: auto;")
  .style("will-change", "transform")
  .style("transform", "translate3d(50px, 0, 0)");

const tooltip_enter = (evt) => {
  const tooltip = evt.currentTarget.dataset.tooltip;
  tooltip_text.text(tooltip);
  tooltip_text.style("font-size", "21px");
  tooltip_text.style("opacity", 1);
  tooltip_text.style("fill", "#fff");
};

const tooltip_leave = (d) => {
  tooltip_text.text("");
};

const tooltip_move = (evt) => {
  // tooltip_text.attr("x", evt.clientX);
  // tooltip_text.attr("y", evt.clientY);
};

// Add a line for each link, and a circle for each node.
const max_link = d3.max(links, (d) => d.value);
const link = svg
  .append("g")
  .attr("stroke", "#fff")
  .attr("stroke-opacity", 0.2)
  .selectAll()
  .data(links)
  .join("line")
  .attr("stroke-width", (d) => d3.scaleLinear([0, max_link], [1, 20])(d.value))
  .attr("data-tooltip", (d) => d.tooltip)
  .on("mouseenter", tooltip_enter)
  .on("mouseleave", tooltip_leave)
  .on("mousemove", tooltip_move);

link.append("title").text((d) => d.tooltip);

const max_node = d3.max(nodes, (d) => d.value);

const node = svg
  .append("g")
  .attr("stroke", "#fff")
  .attr("stroke-opacity", 0.6)
  .attr("stroke-width", 1.2)
  .selectAll()
  .data(nodes)
  .join("circle")
  .attr("r", (d) => d3.scaleLinear([0, max_node], [4, 30])(d.value))
  .attr("fill", (d) => d.color)
  .attr("fill-opacity", 0.6)
  .attr("data-tooltip", (d) => d.tooltip)
  .on("mouseenter", tooltip_enter)
  .on("mouseleave", tooltip_leave)
  .on("mousemove", tooltip_move);

node.append("title").text((d) => d.id);

// Add a drag behavior.
node.call(
  d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended),
);

// Set the position attributes of links and nodes each time the simulation ticks.
function ticked() {
  link
    .attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y);

  node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
}

// Reheat the simulation when drag starts, and fix the subject position.
function dragstarted(event) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  event.subject.fx = event.subject.x;
  event.subject.fy = event.subject.y;
}

// Update the subject (dragged node) position during drag.
function dragged(event) {
  event.subject.fx = event.x;
  event.subject.fy = event.y;
}

// Restore the target alpha so the simulation cools after dragging ends.
// Unfix the subject position now that it’s no longer being dragged.
function dragended(event) {
  if (!event.active) simulation.alphaTarget(0);
  event.subject.fx = null;
  event.subject.fy = null;
}

const tooltip_text = svg
  .append("text")
  .attr("x", 100)
  .attr("y", 100)
  .text("tooltip")
  .style("font-size", "12px")
  .style("opacity", 0);

document.body.appendChild(svg.node());
