import Svg, { Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';


export const LogoSVG = () => (
    <Svg
      width={25}
      height={16}
      viewBox="0 0 25 16"
      fill="none"
     
    >
      <Path
        d="M10.259 15.133h.004c0 .006 0-.005 0 0h3.543v-.415c.036-1.768.559-4.25 1.98-6.3 1.456-2.099 3.93-3.866 8.233-3.866V1.009c-4.74 0-8.041 1.758-10.213 4.204l-.004-3.905a12 12 0 0 0 0-.442c0-.006 0 .006 0 0h-3.543v.415c-.036 1.768-.559 4.251-1.98 6.3-1.456 2.1-3.93 3.867-8.233 3.867v3.542c4.74 0 8.042-1.758 10.213-4.204z"
        fill="url(#a)"
      />
      <Defs>
        <LinearGradient
          id="a"
          x1={13.066}
          y1={6.647}
          x2={5.096}
          y2={17.341}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#2F9A92" />
          <Stop offset={1} stopColor="#2C72FF" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
  
  // Profile Icon SVG Component
 export const ProfileIconSVG = ({ color }: { color: string }) => (
    <Svg
      width={48}
      height={40}
      viewBox="0 0 48 40"
      fill="none"
      
    >
      <Rect width={48} height={40} rx={12} fill={color} fillOpacity={0.05} />
      <Path
        d="M24 18a4 4 0 1 0 0-8 4 4 0 0 0 0 8m8 7.5c0 2.485 0 4.5-8 4.5s-8-2.015-8-4.5 3.582-4.5 8-4.5 8 2.015 8 4.5"
        opacity={0.7}
        fill={color}
      />
    </Svg>
  );
  
  // Add Button SVG Component
 export const AddButtonSVG = () => (
    <Svg 
      width={44} 
      height={44} 
      viewBox="0 0 44 44" 
      fill="none"
    
    >
      <Rect width="44" height="44" rx="12" fill="url(#paint0_linear_554_1478)"/>
      <Path d="M29.0002 23.1644H23.1668V28.9977C23.1668 29.3071 23.0439 29.6039 22.8251 29.8227C22.6063 30.0415 22.3096 30.1644 22.0002 30.1644C21.6907 30.1644 21.394 30.0415 21.1752 29.8227C20.9564 29.6039 20.8335 29.3071 20.8335 28.9977V23.1644H15.0002C14.6907 23.1644 14.394 23.0415 14.1752 22.8227C13.9564 22.6039 13.8335 22.3071 13.8335 21.9977C13.8335 21.6883 13.9564 21.3916 14.1752 21.1728C14.394 20.954 14.6907 20.8311 15.0002 20.8311H20.8335V14.9977C20.8335 14.6883 20.9564 14.3916 21.1752 14.1728C21.394 13.954 21.6907 13.8311 22.0002 13.8311C22.3096 13.8311 22.6063 13.954 22.8251 14.1728C23.0439 14.3916 23.1668 14.6883 23.1668 14.9977V20.8311H29.0002C29.3096 20.8311 29.6063 20.954 29.8251 21.1728C30.0439 21.3916 30.1668 21.6883 30.1668 21.9977C30.1668 22.3071 30.0439 22.6039 29.8251 22.8227C29.6063 23.0415 29.3096 23.1644 29.0002 23.1644Z" fill="white"/>
      <Defs>
        <LinearGradient id="paint0_linear_554_1478" x1="23.8967" y1="17.8292" x2="-1.11228" y2="37.8036" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#2F9A92"/>
          <Stop offset="1" stopColor="#2C72FF"/>
        </LinearGradient>
      </Defs>
    </Svg>
  );


  // Custom SVG Home Icon component
export const HomeIcon = ({color} : {color: string})  => {

    return (
      <Svg width={19} height={20} viewBox="0 0 19 20" fill="none">
      <Path
        d="m10.19 2.06 5.867 4.817c.33.27.527.686.527 1.13v8.803c0 .814-.639 1.44-1.383 1.44h-2.617V13.5a2.75 2.75 0 0 0-2.75-2.75h-1a2.75 2.75 0 0 0-2.75 2.75v4.75H3.467c-.745 0-1.383-.626-1.383-1.44V8.008c0-.445.197-.86.527-1.13l5.866-4.82a1.34 1.34 0 0 1 1.713.002m5.01 17.689c1.61 0 2.884-1.335 2.884-2.94V8.007a2.96 2.96 0 0 0-1.075-2.29L11.143.9a2.84 2.84 0 0 0-3.617 0L1.659 5.718a2.96 2.96 0 0 0-1.075 2.29v8.802c0 1.605 1.273 2.94 2.883 2.94z"
        fill={color}
      />
    </Svg>
    );
  };
  // Custom SVG Chat Icon component (you'll need to create this with your own SVG path)
 export const ChatIcon = ({ color} : { color:string }) => {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="m20.713 8.128-.246.566a.506.506 0 0 1-.934 0l-.246-.566a4.36 4.36 0 0 0-2.22-2.25l-.759-.339a.53.53 0 0 1 0-.963l.717-.319a4.37 4.37 0 0 0 2.251-2.326l.253-.61a.506.506 0 0 1 .942 0l.253.61a4.37 4.37 0 0 0 2.25 2.326l.718.32a.53.53 0 0 1 0 .962l-.76.338a4.36 4.36 0 0 0-2.219 2.251M10 3h4v2h-4a6 6 0 0 0-6 6c0 3.61 2.462 5.966 8 8.48V17h2a6 6 0 0 0 6-6h2a8 8 0 0 1-8 8v3.5c-5-2-12-5-12-11.5a8 8 0 0 1 8-8"
          fill={color}
          opacity={0.75}
        />
      </Svg>
    );
  };

   export const MultiSeclectIcon = () => {
    return (
      <Svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth={2}
  >
    <Path d="M9 11l3 3L22 4" />
    <Path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </Svg>
    );
  };
  
  // Custom SVG Users Icon component (you'll need to create this with your own SVG path)
 export  const UsersIcon = ({color}: {color: string}) => {  
    return (
      <Svg width={23} height={20} viewBox="0 0 23 20" fill="none">
        <Path
          d="M15.167 19v-2a4 4 0 0 0-4-4h-6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8m13 10v-2a4 4 0 0 0-3-3.87m-3-12a4 4 0 0 1 0 7.75"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
  
     
    );
  };


  export const Tail = ({color} : {color:string}) => {
    return (
      <Svg
    width={20}
    height={15}
    viewBox="0 0 20 15"
    fill="none"
  >
    <Path
      d="M19.426 14.128c-7.6-3.6-9.834-10.834-10-14-4.334-.5-12.1.2-8.5 7s13.833 7.5 18.5 7"
      fill={color}
    />
  </Svg>
    )
  }

  export const downloadIcon = () => {

    return (
      <Svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
   
  >
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7 22a5 5 0 0 1-5-5v-3a1 1 0 1 1 2 0v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3a1 1 0 0 1 2 0v3a5 5 0 0 1-5 5z"
      fill="url(#a)"
    />
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17.715 10.9a1 1 0 0 1-.016 1.415l-4.5 4.4a1 1 0 0 1-1.398 0l-4.5-4.4a1 1 0 1 1 1.398-1.43l2.801 2.739V5a1 1 0 1 1 2 0v8.624l2.8-2.739a1 1 0 0 1 1.415.016z"
      fill="url(#b)"
    />
    <Defs>
      <LinearGradient
        id="a"
        x1={12.862}
        y1={16.647}
        x2={8.376}
        y2={24.61}
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#2F9A92" />
        <Stop offset={1} stopColor="#2C72FF" />
      </LinearGradient>
      <LinearGradient
        id="b"
        x1={12.97}
        y1={9.268}
        x2={5.938}
        y2={14.024}
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#2F9A92" />
        <Stop offset={1} stopColor="#2C72FF" />
      </LinearGradient>
    </Defs>
  </Svg>
    )

  }