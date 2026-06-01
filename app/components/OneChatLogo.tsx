import Image from "next/image"

interface Props {
  className?: string
  height?: number
  width?: number
}

export default function OneChatLogo({ className = "h-9 w-auto", height = 48, width = 180 }: Props) {
  return (
    <>
      <Image
        src="/OneChater-35-blobs/svg/horizontal-light.svg"
        alt="OneChat"
        height={height}
        width={width}
        className={`${className} logo-dark-hidden`}
        priority
      />
      <Image
        src="/OneChater-35-blobs/svg/horizontal-dark.svg"
        alt="OneChat"
        height={height}
        width={width}
        className={`${className} logo-dark-only`}
        aria-hidden="true"
        priority
      />
    </>
  )
}
