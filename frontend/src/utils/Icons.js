export class Icons {
  static getLocationIcon(width = 32, height = 32, color = "#000000") {
    return (
      <svg
        fill={color}
        version="1.1"
        width={width}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path
          d="M12,2C8.1,2,5,5.1,5,9c0,6,7,13,7,13s7-7.1,7-13C19,5.1,15.9,2,12,2z M12,11.5c-1.4,0-2.5-1.1-2.5-2.5s1.1-2.5,2.5-2.5
                s2.5,1.1,2.5,2.5S13.4,11.5,12,11.5z"
        />
        <rect fill="none" width="24" height="24" />
      </svg>
    );
  }

  static getControllerIcon(width = 32, height = 32, color = "#000000") {
    return (
      <svg
        fill={color}
        width={width}
        height={height}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M21.986 9.74a3.193 3.193 0 0 0-.008-.088A5.003 5.003 0 0 0 17 5H7a4.97 4.97 0 0 0-4.987 4.737c-.01.079-.013.161-.013.253v6.51c0 .925.373 1.828 1.022 2.476A3.524 3.524 0 0 0 5.5 20c1.8 0 2.504-1 3.5-3 .146-.292.992-2 3-2 1.996 0 2.853 1.707 3 2 1.004 2 1.7 3 3.5 3 .925 0 1.828-.373 2.476-1.022A3.524 3.524 0 0 0 22 16.5V10c0-.095-.004-.18-.014-.26zM7 12.031a2 2 0 1 1-.001-3.999A2 2 0 0 1 7 12.031zm10-5a1 1 0 1 1 0 2 1 1 0 1 1 0-2zm-2 4a1 1 0 1 1 0-2 1 1 0 1 1 0 2zm2 2a1 1 0 1 1 0-2 1 1 0 1 1 0 2zm2-2a1 1 0 1 1 0-2 1 1 0 1 1 0 2z" />
      </svg>
    );
  }

  static getCameraIcon(width = 32, height = 32, color = "#000000") {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 -2 32 32"
        fill={color}
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>camera</title>
        <desc>Created with Sketch Beta.</desc>
        <defs></defs>
        <g
          id="Page-1"
          stroke="none"
          strokeWidth="1"
          fill={color}
          fillRule="evenodd"
        >
          <g
            id="Icon-Set-Filled"
            transform="translate(-258.000000, -467.000000)"
            fill={color}
          >
            <path
              d="M286,471 L283,471 L282,469 C281.411,467.837 281.104,467 280,467 L268,467 C266.896,467 266.53,467.954 266,469 L265,471 L262,471 C259.791,471 258,472.791 258,475 L258,491 C258,493.209 259.791,495 262,495 L286,495 C288.209,495 290,493.209 290,491 L290,475 C290,472.791 288.209,471 286,471 Z M274,491 C269.582,491 266,487.418 266,483 C266,478.582 269.582,475 274,475 C278.418,475 282,478.582 282,483 C282,487.418 278.418,491 274,491 Z M274,477 C270.687,477 268,479.687 268,483 C268,486.313 270.687,489 274,489 C277.313,489 280,486.313 280,483 C280,479.687 277.313,477 274,477 L274,477 Z"
              id="camera"
            ></path>
          </g>
        </g>
      </svg>
    );
  }

  static getSpeedIcon(width = 24, height = 24, color = "#000000") {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke={color}
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M12 6V4M18 12h2M12 18v2M6 12H4"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M16.95 7.05L18.36 5.64M16.95 16.95L18.36 18.36M7.05 7.05L5.64 5.64M7.05 16.95L5.64 18.36"
          stroke={color}
          strokeWidth="1"
          strokeLinecap="round"
        />
        <line
          x1="12"
          y1="12"
          x2="15"
          y2="9"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="1.5" fill={color} />
      </svg>
    );
  }

  static getSignalIcon(width = 24, height = 24, color = "#000000") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        viewBox="-5.0 -10.0 110.0 135.0"
        width={width}
        height={height}
        fill={color}
      >
        <path d="m20.832 55.207c4.0273 0 7.293 3.2656 7.293 7.293v25c0 4.0273-3.2656 7.293-7.293 7.293h-8.332c-4.0273 0-7.293-3.2656-7.293-7.293v-25c0-4.0273 3.2656-7.293 7.293-7.293z" />
        <path d="m54.168 30.207c4.0273 0 7.2891 3.2656 7.2891 7.293v50c0 4.0273-3.2617 7.293-7.2891 7.293h-8.3359c-4.0273 0-7.2891-3.2656-7.2891-7.293v-50c0-4.0273 3.2617-7.293 7.2891-7.293z" />
        <path d="m87.5 5.207c4.0273 0 7.293 3.2656 7.293 7.293v75c0 4.0273-3.2656 7.293-7.293 7.293h-8.332c-4.0273 0-7.293-3.2656-7.293-7.293v-75c0-4.0273 3.2656-7.293 7.293-7.293z" />
      </svg>
    );
  }

  static getDroneIcon(width = 50, height = 50, color = "#3B82F6") {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" }}
      >
        {/* Propellers - Top Left */}
        <g
          className="propeller-top-left"
          style={{ transformOrigin: "100px 100px" }}
        >
          <circle cx="100" cy="100" r="45" fill={color} fillOpacity="0.1" />
          <ellipse cx="100" cy="100" rx="40" ry="8" fill={color} />
          <ellipse cx="100" cy="100" rx="8" ry="40" fill={color} />
        </g>

        {/* Propellers - Top Right */}
        <g
          className="propeller-top-right"
          style={{ transformOrigin: "300px 100px" }}
        >
          <circle cx="300" cy="100" r="45" fill={color} fillOpacity="0.1" />
          <ellipse cx="300" cy="100" rx="40" ry="8" fill={color} />
          <ellipse cx="300" cy="100" rx="8" ry="40" fill={color} />
        </g>

        {/* Propellers - Bottom Left */}
        <g
          className="propeller-bottom-left"
          style={{ transformOrigin: "100px 300px" }}
        >
          <circle cx="100" cy="300" r="45" fill={color} fillOpacity="0.1" />
          <ellipse cx="100" cy="300" rx="40" ry="8" fill={color} />
          <ellipse cx="100" cy="300" rx="8" ry="40" fill={color} />
        </g>

        {/* Propellers - Bottom Right */}
        <g
          className="propeller-bottom-right"
          style={{ transformOrigin: "300px 300px" }}
        >
          <circle cx="300" cy="300" r="45" fill={color} fillOpacity="0.1" />
          <ellipse cx="300" cy="300" rx="40" ry="8" fill={color} />
          <ellipse cx="300" cy="300" rx="8" ry="40" fill={color} />
        </g>

        {/* Arms */}
        <rect x="150" y="195" width="100" height="10" fill="#2D3748" rx="5" />
        <rect x="195" y="150" width="10" height="100" fill="#2D3748" rx="5" />

        {/* Main Body */}
        <ellipse cx="200" cy="200" rx="80" ry="50" fill="#4A5568" />
        <ellipse cx="200" cy="200" rx="70" ry="40" fill="#718096" />
        <ellipse cx="200" cy="200" rx="60" ry="30" fill="#A0AEC0" />

        {/* Camera Gimbal */}
        <ellipse cx="200" cy="230" rx="25" ry="20" fill="#2D3748" />
        <circle cx="200" cy="235" r="12" fill="#1A202C" />
        <circle cx="200" cy="235" r="8" fill="#4299E1" />
        <circle cx="200" cy="235" r="6" fill="#1A202C" />

        {/* Landing Gear */}
        <rect x="160" y="250" width="80" height="8" fill="#2D3748" rx="4" />
        <rect x="165" y="250" width="8" height="20" fill="#2D3748" rx="4" />
        <rect x="227" y="250" width="8" height="20" fill="#2D3748" rx="4" />

        {/* LED Lights */}
        <circle cx="170" cy="180" r="4" fill="#F56565" />
        <circle cx="230" cy="180" r="4" fill="#48BB78" />
        <circle cx="170" cy="220" r="4" fill="#ED8936" />
        <circle cx="230" cy="220" r="4" fill="#9F7AEA" />

        {/* Center Hub */}
        <circle cx="200" cy="200" r="15" fill="#1A202C" />
        <circle cx="200" cy="200" r="10" fill="#4A5568" />
        <circle cx="200" cy="200" r="5" fill={color} />

        {/* Highlights */}
        <ellipse
          cx="185"
          cy="185"
          rx="20"
          ry="10"
          fill="white"
          fillOpacity="0.3"
        />
        <circle cx="205" cy="190" r="3" fill="white" fillOpacity="0.6" />
      </svg>
    );
  }

  static getCameraDroneIcon(width = 50, height = 50, color = "#3B82F6") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        fill="none"
        id="drone-camera"
        viewBox="0 0 24 24"
      >
        <path fill="#444" d="M11.723 12.86h.555v1.11h-.555z"></path>
        <path
          stroke="#444"
          stroke-linecap="round"
          stroke-width=".333"
          d="M2.176 7.809h6.327M15.496 7.809h6.327"
        ></path>
        <path
          fill="#444"
          d="M4.93 8.167s0-.667.41-.667c.422 0 .422.667.422.667V8.5h-.833zM18.25 8.167s0-.667.41-.667c.422 0 .422.667.422.667V8.5h-.833z"
        ></path>
        <path
          fill="#303030"
          d="M4.785 8.42s.329-.056.555-.056.555.056.555.056v1.11h-1.11zM18.105 8.42s.329-.056.555-.056.555.056.555.056v1.11h-1.11z"
        ></path>
        <path
          fill="#444"
          d="M8.051 11.076a.25.25 0 0 1 .235-.159c.183 0 .309.187.244.357-.133.35-.326.892-.415 1.309-.208.969-.099 2.395-.035 3.018a.28.28 0 0 1-.279.311.27.27 0 0 1-.269-.238c-.061-.578-.188-2.083.028-3.091.109-.507.37-1.199.491-1.507M15.828 11.076a.25.25 0 0 0-.236-.159.263.263 0 0 0-.243.357c.133.35.326.892.415 1.309.208.969.099 2.395.035 3.018a.28.28 0 0 0 .279.311.27.27 0 0 0 .269-.238c.061-.578.188-2.083-.028-3.091-.109-.507-.37-1.199-.491-1.507"
        ></path>
        <path
          fill="#D9D9D9"
          d="M4 10.086c0-.474.356-.872.827-.92 1.54-.156 4.894-.468 7.173-.468s5.634.312 7.173.468a.92.92 0 0 1 .827.92.93.93 0 0 1-.832.925l-3.875.413a1.11 1.11 0 0 0-.807.489l-.492.74a1.11 1.11 0 0 1-.924.495h-2.14a1.11 1.11 0 0 1-.924-.496l-.492-.74a1.11 1.11 0 0 0-.807-.488l-3.875-.413A.93.93 0 0 1 4 10.086"
        ></path>
        <path
          stroke="#2247CA"
          stroke-linecap="round"
          stroke-width=".404"
          d="M11.204 11.212a.92.92 0 0 1 .808-.404c.353 0 .596.122.808.404M10.8 10.404c.317-.282.683-.404 1.212-.404.53 0 .895.122 1.212.404"
        ></path>
        <circle cx="12.012" cy="11.818" r=".404" fill="#2247CA"></circle>
        <rect
          width="2.22"
          height="1.665"
          x="10.89"
          y="13.97"
          fill="#D9D9D9"
          rx=".278"
        ></rect>
        <circle cx="12.014" cy="14.872" r=".416" fill="#4A4A4A"></circle>
        <circle cx="12.014" cy="14.872" r=".278" fill="#595959"></circle>
        <circle cx="12.014" cy="14.872" r=".208" fill="#474747"></circle>
      </svg>
    );
  }
}
