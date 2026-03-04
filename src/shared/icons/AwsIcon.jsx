import React from 'react'

const AwsIcon = ({ className, ...props }) => {
    return (
        <img className={className} src='/aws.png' alt='AWS Icon' {...props} />
    )
}

export default AwsIcon
