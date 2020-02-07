import React, { forwardRef, useState, useEffect, useImperativeHandle } from 'react';

const Timer = forwardRef((props, ref) => {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);

    useImperativeHandle(ref, () => ({
        reset() {
            setSeconds(0);
            setIsActive(true);
        },
        toggle() {
        setIsActive(!isActive);
    }

    }));


    useEffect(() => {
        let interval = null;
        if (isActive) {
            interval = setInterval(() => {
                setSeconds(seconds => seconds + 1);
            }, 1000);
        } else if (!isActive && seconds !== 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, seconds]);
    return (
        <div className="app">
            <div className="time">
                time : {seconds}s
      </div>
        </div>
    );
});

export default Timer;