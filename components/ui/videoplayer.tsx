import React from 'react'
import ReactPlayer from 'react-player'

interface VideoPlayerProps {
  url: string // Ensuring that the 'url' prop is a string
  rounded: string
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, rounded }) => {
  return (
    <div className="video-player-container relative w-full h-[98%]">
      <ReactPlayer
        url={url} // Passing the URL as a prop
        className={`rounded-md react-player rounded-${rounded}`}
        playing={false} // Autoplay control
        controls={true} // Show built-in controls
        width="100%" // Full width of the parent container
        height="100%" // Full height of the parent container
      />
    </div>
  )
}

export default VideoPlayer
