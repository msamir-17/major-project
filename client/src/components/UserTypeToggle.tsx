import React from 'react';
import { motion } from 'framer-motion';
import { User, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserTypeToggleProps {
    isMentor: boolean;
    onChange: (isMentor: boolean) => void;
}

const UserTypeToggle: React.FC<UserTypeToggleProps> = ({ isMentor, onChange }) => {
    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-center text-muted-foreground">
                I want to join as a:
            </h3>

            <div className="grid grid-cols-2 gap-3">
                <motion.button
                    type="button"
                    onClick={() => onChange(false)}
                    className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-300",
                        !isMentor
                            ? "border-primary bg-primary/10 text-primary shadow-medium"
                            : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <User className="h-6 w-6" />
                    <div className="text-center">
                        <p className="font-medium">Learner</p>
                        <p className="text-xs text-muted-foreground">
                            Find mentors and grow
                        </p>
                    </div>
                </motion.button>

                <motion.button
                    type="button"
                    onClick={() => onChange(true)}
                    className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-300",
                        isMentor
                            ? "border-blue-500 bg-blue-100 text-blue-700 shadow-medium"
                            : "border-border bg-card hover:border-blue-300 hover:bg-blue/5"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <GraduationCap className="h-6 w-6 text-black" />
                    <div className="text-center">
                        <p className="font-medium text-black">Mentor</p>
                        <p className="text-xs text-muted-foreground">
                            Share knowledge and help
                        </p>
                    </div>
                </motion.button>
            </div>
        </div>
    );
};

export default UserTypeToggle;