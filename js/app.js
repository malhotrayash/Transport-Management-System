let role = "user"; // default role
let graphData = null;
let employeeData = null;

// --- Role switching ---
function setRole(newRole) {
    role = newRole;
    document.getElementById("node-info").innerText = `Current role: ${role}`;
}

// --- Load data and initialize graph ---
async function loadData() {
    try {
        const cityResp = await fetch("data/city.json");
        graphData = await cityResp.json();

        const empResp = await fetch("data/employees.json");
        employeeData = await empResp.json();

        drawGraph();
    } catch (err) {
        console.error("Error loading data:", err);
    }
}

// --- Draw graph on canvas ---
function drawGraph() {
    const canvas = document.getElementById("graphCanvas");
    const ctx = canvas.getContext("2d");
    resizeCanvas(canvas);

    const nodes = graphData.nodes;
    const edges = graphData.edges;

    // --- Find bounding box of all node positions ---
    let xs = [], ys = [];
    for (const id in nodes) {
        xs.push(nodes[id].pos[0]);
        ys.push(nodes[id].pos[1]);
    }
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);

    const padding = 40; // some space around the graph
    const scaleX = (canvas.width - 2 * padding) / (maxX - minX);
    const scaleY = (canvas.height - 2 * padding) / (maxY - minY);

    // scale so aspect ratio is preserved
    const scale = Math.min(scaleX, scaleY);

    function transform([x, y]) {
        return [
            (x - minX) * scale + padding,
            (y - minY) * scale + padding
        ];
    }

    // --- Draw edges ---
    ctx.strokeStyle = "#bdc3c7";
    edges.forEach(edge => {
        const u = transform(nodes[edge.u].pos);
        const v = transform(nodes[edge.v].pos);
        ctx.beginPath();
        ctx.moveTo(u[0], u[1]);
        ctx.lineTo(v[0], v[1]);
        ctx.stroke();
    });

    // --- Draw nodes ---
    for (const id in nodes) {
        const pos = transform(nodes[id].pos);
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], 5, 0, Math.PI * 2);
        ctx.fillStyle = "steelblue";
        ctx.fill();

        if (parseInt(id) === employeeData.office) {
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(pos[0], pos[1], 7, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // --- Hover detection also needs scaling ---
    canvas.onmousemove = function (event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const nodeId = findNodeAt(x, y, nodes, transform);
        if (nodeId !== null) {
            showNodeInfo(nodeId);
        } else {
            document.getElementById("node-info").innerText = "Hover a node to see details";
        }
    };
}

function findNodeAt(x, y, nodes, transform) {
    for (const id in nodes) {
        const [nx, ny] = transform(nodes[id].pos);
        const dx = x - nx;
        const dy = y - ny;
        if (Math.sqrt(dx * dx + dy * dy) < 6) {
            return parseInt(id);
        }
    }
    return null;
}


// --- Resize canvas to fit section ---
function resizeCanvas(canvas) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

// --- Find node under cursor ---
function findNodeAt(x, y, nodes) {
    for (const id in nodes) {
        const [nx, ny] = nodes[id].pos;
        const dx = x - nx;
        const dy = y - ny;
        if (Math.sqrt(dx * dx + dy * dy) < 6) {
            return parseInt(id);
        }
    }
    return null;
}

// --- Show node info panel ---
function showNodeInfo(nodeId) {
    const nodeUsers = employeeData.employees.filter(u => u.node === nodeId);
    let html = `<strong>Node ${nodeId}</strong><br/>`;
    if (nodeUsers.length > 0) {
        html += "<ul>";
        nodeUsers.forEach(u => {
            html += `<li>${u.name} (ID: ${u.id}, Team: ${u.team})</li>`;
        });
        html += "</ul>";
    } else {
        html += "No users on this node.";
    }
    document.getElementById("node-info").innerHTML = html;
}

// --- Init ---
window.onload = loadData;
