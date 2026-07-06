(function () {
  const parseMetadata = metadata => {
    const { dimensions: dimensionsMap, mainStructureMembers: measuresMap } = metadata
    const dimensions = []
    for (const key in dimensionsMap) {
      const dimension = dimensionsMap[key]
      dimensions.push({ key, ...dimension })
    }
    const measures = []
    for (const key in measuresMap) {
      const measure = measuresMap[key]
      measures.push({ key, ...measure })
    }
    return { dimensions, measures, dimensionsMap, measuresMap }
  }

  const template = document.createElement('template')
  template.innerHTML = `
    <style>
      :host {
        display: block;
        width: 100%;
        height: 100%;
        font-family: Arial, sans-serif;
        overflow-y: auto;
        padding: 10px;
        box-sizing: border-box;
      }
      .progress-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .progress-row {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
        color: #555;
        font-size: 13px;
      }
      .label {
        text-transform: uppercase;
      }
      .value {
        color: #333;
      }
      .track {
        width: 100%;
        height: 16px;
        background-color: #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
      }
      .fill {
        height: 100%;
        border-radius: 8px;
        transition: width 0.5s ease-in-out;
      }
    </style>
    <div id="root" class="progress-container"></div>
  `

  class ProgressBarWidget extends HTMLElement {
    constructor () {
      super()
      this._shadowRoot = this.attachShadow({ mode: 'open' })
      this._shadowRoot.appendChild(template.content.cloneNode(true))
      this._root = this._shadowRoot.getElementById('root')
      
      // Color palette matching the image (Green, Yellow/Gold, Orange, Red, Dark Red)
      this.colors = ['#2ecc71', '#d4ac0d', '#e67e22', '#e74c3c', '#a93226', '#3498db', '#9b59b6']
    }

    onCustomWidgetResize (width, height) {
      this.render()
    }

    onCustomWidgetAfterUpdate (changedProps) {
      this.render()
    }

    render () {
      const dataBinding = this.dataBinding
      if (!dataBinding || dataBinding.state !== 'success') { 
        this._root.innerHTML = `<div style="color: #999;">No data available. Please bind a dimension and a measure.</div>`
        return 
      }

      const { data, metadata } = dataBinding
      const { dimensions, measures } = parseMetadata(metadata)

      if (dimensions.length === 0 || measures.length === 0) {
        return
      }

      // Find the maximum value to scale the progress bars accurately
      const measureKey = measures[0].key;
      let maxValue = 0;
      data.forEach(row => {
        const val = row[measureKey].raw;
        if (val > maxValue) maxValue = val;
      });

      // Clear existing content
      this._root.innerHTML = '';

      // Build rows
      data.forEach((row, index) => {
        const labelText = dimensions.map(dim => row[dim.key].label).join(' - ');
        
        // Use formattedValue if SAC provides it (keeps currency symbols), otherwise fallback to raw
        const valueData = row[measureKey];
        const displayValue = valueData.formattedValue ? valueData.formattedValue : valueData.raw.toLocaleString();
        const rawValue = valueData.raw;

        // Calculate percentage width (cap at 100%)
        const percentage = maxValue > 0 ? Math.min((rawValue / maxValue) * 100, 100) : 0;
        const color = this.colors[index % this.colors.length];

        // Create DOM elements for the row
        const rowDiv = document.createElement('div');
        rowDiv.className = 'progress-row';

        rowDiv.innerHTML = `
          <div class="header">
            <span class="label">${labelText}</span>
            <span class="value">${displayValue}</span>
          </div>
          <div class="track">
            <div class="fill" style="width: ${percentage}%; background-color: ${color};"></div>
          </div>
        `;

        this._root.appendChild(rowDiv);
      });
    }
  }

  customElements.define('com-sap-sample-progressbar', ProgressBarWidget)
})()