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
}
