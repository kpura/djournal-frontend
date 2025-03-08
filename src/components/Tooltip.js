import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';

const Tooltip = ({ 
  visible, 
  text, 
  position = 'bottom', 
  duration = 3000, 
  autoHide = true,
  onHide 
}) => {
  const [animation] = useState(new Animated.Value(0));
  
  useEffect(() => {
    if (visible) {
      Animated.timing(animation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      if (autoHide) {
        const timer = setTimeout(() => {
          handleHide();
        }, duration);
        
        return () => clearTimeout(timer);
      }
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);
  
  const handleHide = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (onHide) onHide();
    });
  };
  
  // Calculate positioning
  const getPositionStyle = () => {
    switch(position) {
      case 'top':
        return { top: -60 };
      case 'left':
        return { left: -160, top: 0 };
      case 'right':
        return { right: -160, top: 0 };
      default: // bottom
        return { bottom: -60 };
    }
  };
  
  // Calculate arrow positioning
  const getArrowStyle = () => {
    switch(position) {
      case 'top':
        return styles.arrowBottom;
      case 'left':
        return styles.arrowRight;
      case 'right':
        return styles.arrowLeft;
      default: // bottom
        return styles.arrowTop;
    }
  };
  
  const opacityStyle = {
    opacity: animation
  };
  
  const translateStyle = {
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [position === 'top' ? -10 : 10, 0],
        }),
      },
    ],
  };
  
  if (!visible) return null;
  
  return (
    <TouchableWithoutFeedback onPress={handleHide}>
      <Animated.View 
        style={[
          styles.container, 
          getPositionStyle(), 
          opacityStyle,
          translateStyle
        ]}
      >
        <View style={[styles.arrow, getArrowStyle()]} />
        <View style={styles.bubble}>
          <Text style={styles.text}>{text}</Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    zIndex: 999,
  },
  bubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 10,
    width: '100%',
  },
  text: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  arrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    alignSelf: 'center',
    position: 'absolute',
  },
  arrowTop: {
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(0, 0, 0, 0.8)',
    top: -8,
  },
  arrowBottom: {
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(0, 0, 0, 0.8)',
    bottom: -8,
  },
  arrowLeft: {
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'rgba(0, 0, 0, 0.8)',
    left: -8,
  },
  arrowRight: {
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'rgba(0, 0, 0, 0.8)',
    right: -8,
  },
});

export const withTooltip = (WrappedComponent) => {
  return ({ tooltip, tooltipPosition, ...props }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    
    return (
      <View style={{ position: 'relative' }}>
        <TouchableWithoutFeedback 
          onPress={() => props.onPress && props.onPress()}
          onLongPress={() => setShowTooltip(true)}
        >
          <View>
            <WrappedComponent {...props} />
            {tooltip && (
              <Tooltip 
                visible={showTooltip}
                text={tooltip}
                position={tooltipPosition || 'bottom'}
                onHide={() => setShowTooltip(false)}
              />
            )}
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  };
};

export default Tooltip;