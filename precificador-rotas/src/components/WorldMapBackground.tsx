import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json';

export function WorldMapBackground() {
  return (
    <div className="world-map-bg-container">
      {/* Map layer */}
      <div className="world-map-layer">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 160,
            center: [10, 20],
          }}
          width={980}
          height={550}
          style={{ width: '100%', height: '100%' }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rpiKey || geo.rsmKey}
                  geography={geo}
                  fill="rgba(56,189,248,0.04)"
                  stroke="rgba(56,189,248,0.12)"
                  strokeWidth={0.6}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* Compass rose */}
      <div className="compass-rose-layer">
        <img src="/rosa-dos-ventos.svg" alt="" draggable={false} />
      </div>

      {/* Animated route dots */}
      <svg className="route-dots-layer" viewBox="0 0 980 550" preserveAspectRatio="xMidYMid slice">
        <g fill="rgba(56,189,248,0.2)">
          {/* São Paulo */}
          <circle cx="300" cy="380" r="2.5">
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2.2s" repeatCount="indefinite"/>
          </circle>
          {/* New York */}
          <circle cx="240" cy="195" r="2.5">
            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite"/>
          </circle>
          {/* London */}
          <circle cx="475" cy="155" r="2.5">
            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3.5s" repeatCount="indefinite"/>
          </circle>
          {/* Dubai */}
          <circle cx="603" cy="245" r="2">
            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2.8s" repeatCount="indefinite"/>
          </circle>
          {/* Shanghai */}
          <circle cx="760" cy="215" r="2.5">
            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2.6s" repeatCount="indefinite"/>
          </circle>
          {/* Tokyo */}
          <circle cx="800" cy="200" r="2">
            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3.8s" repeatCount="indefinite"/>
          </circle>
          {/* Singapore */}
          <circle cx="710" cy="310" r="2">
            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3.3s" repeatCount="indefinite"/>
          </circle>
          {/* Sydney */}
          <circle cx="820" cy="430" r="2.5">
            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2.4s" repeatCount="indefinite"/>
          </circle>
          {/* Lagos */}
          <circle cx="490" cy="300" r="2">
            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="4s" repeatCount="indefinite"/>
          </circle>
        </g>

        {/* Route arcs */}
        <g stroke="rgba(56,189,248,0.06)" fill="none" strokeWidth="0.8" strokeDasharray="4 3">
          <path d="M300 380 Q260 290 240 195"/>
          <path d="M240 195 Q360 150 475 155"/>
          <path d="M475 155 Q540 180 603 245"/>
          <path d="M603 245 Q680 230 760 215"/>
          <path d="M300 380 Q400 340 490 300"/>
          <path d="M710 310 Q770 370 820 430"/>
        </g>
      </svg>
    </div>
  );
}
